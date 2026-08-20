'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Op } = require('sequelize')
const { Service } = require('egg')

const itemStatuses = new Set(['enabled', 'disabled'])
const reportStatuses = new Set(['approved', 'rejected'])
const conclusions = new Set(['qualified', 'unqualified'])

const fieldPermissions = {
  productId: 'quality.field.product',
  productCode: 'quality.field.product',
  productName: 'quality.field.product',
  institution: 'quality.field.institution',
  inspectionDate: 'quality.field.date',
  validUntil: 'quality.field.date',
  reviewedAt: 'quality.field.date',
  status: 'quality.field.status',
  conclusion: 'quality.field.result',
  resultItems: 'quality.field.result',
}

function invalid(message, status = 400) {
  const error = new Error(message)
  error.status = status
  throw error
}

function required(value, label, max = 255) {
  const text = String(value || '').trim()
  if (!text) invalid(`请填写${label}`)
  if (text.length > max) invalid(`${label}不能超过 ${max} 个字符`)
  return text
}

function positiveInteger(value, label) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) invalid(`${label}无效`)
  return number
}

function validDate(value, label) {
  const text = required(value, label, 20)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(text).getTime())) {
    invalid(`${label}格式不正确`)
  }
  return text
}

function parseResultItems(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!Array.isArray(parsed) || !parsed.length) invalid('请至少填写一个检测项目')
    return parsed
  } catch (error) {
    if (error.status) throw error
    invalid('检测项目数据格式不正确')
  }
}

/**
 * 管理检测报告、检测项目定义、审核状态、附件和质量操作历史。
 */
class QualityService extends Service {
  reportInclude() {
    const model = this.app.model
    return [
      { model: model.Product, as: 'product', attributes: ['id', 'code', 'name'] },
      { model: model.File, as: 'file', attributes: ['id', 'originalName', 'size'] },
      { model: model.Employee, as: 'submitter', attributes: ['id', 'name'] },
      { model: model.Employee, as: 'reviewer', attributes: ['id', 'name'] },
    ]
  }

  effectiveStatus(item) {
    // 已批准但超过有效期的报告仅在响应中显示为过期，不改写审核状态。
    const today = new Date().toISOString().slice(0, 10)
    return item.status === 'approved' && item.validUntil < today
      ? 'expired'
      : item.status
  }

  reportJson(item, permissions = null) {
    // 报告字段在服务端按权限裁剪，避免仅靠界面隐藏敏感信息。
    const data = {
      id: Number(item.id),
      reportNo: item.reportNo,
      name: item.name,
      productId: Number(item.productId),
      productCode: item.product?.code || '',
      productName: item.product?.name || '',
      institution: item.institution,
      inspectionNo: item.inspectionNo,
      inspectionDate: item.inspectionDate,
      validUntil: item.validUntil,
      conclusion: item.conclusion,
      status: this.effectiveStatus(item),
      resultItems: item.resultItems || [],
      remarks: item.remarks || '',
      fileId: Number(item.fileId),
      fileName: item.file?.originalName || '',
      fileSize: Number(item.file?.size || 0),
      submitterName: item.submitter?.name || '-',
      reviewerName: item.reviewer?.name || '-',
      reviewedAt: this.ctx.helper.formatDateTime(item.reviewedAt),
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
      updatedAt: this.ctx.helper.formatDateTime(item.updatedAt),
    }
    if (permissions) {
      for (const [key, permission] of Object.entries(fieldPermissions)) {
        if (!permissions.includes(permission)) delete data[key]
      }
    }
    return data
  }

  itemJson(item) {
    return {
      id: Number(item.id),
      code: item.code,
      name: item.name,
      category: item.category,
      standardRequirement: item.standardRequirement,
      unit: item.unit || '',
      status: item.status,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
      updatedAt: this.ctx.helper.formatDateTime(item.updatedAt),
    }
  }

  async log(action, targetType, targetId, detail = null, transaction = null) {
    const log = await this.app.model.OperationLog.create({
      employeeId: this.ctx.state.user?.id || null,
      module: '检测中心',
      action,
      targetType,
      targetId,
      detail: {
        request: {
          method: this.ctx.method,
          path: this.ctx.path,
          params: this.ctx.params,
          query: this.ctx.query,
          body: this.ctx.request.body,
          files: (this.ctx.request.files || []).map((file) => ({
            name: file.filename,
            mimeType: file.mime,
          })),
        },
        response: null,
        context: detail,
      },
      ip: this.ctx.ip,
    }, { transaction })
    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(log.id))
  }

  async options() {
    const [products, items] = await Promise.all([
      this.app.model.Product.findAll({
        where: { status: { [Op.ne]: 'removed' } },
        attributes: ['id', 'code', 'name'],
        order: [['id', 'DESC']],
      }),
      this.app.model.QualityInspectionItem.findAll({
        where: { status: 'enabled' },
        order: [['category', 'ASC'], ['id', 'ASC']],
      }),
    ])
    return {
      products: products.map((item) => ({
        id: Number(item.id),
        code: item.code,
        name: item.name,
      })),
      items: items.map((item) => this.itemJson(item)),
    }
  }

  reportWhere(query) {
    const where = {}
    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where[Op.or] = ['reportNo', 'name', 'institution', 'inspectionNo']
        .map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
      where[Op.or].push({ '$product.name$': { [Op.like]: `%${keyword}%` } })
    }
    if (query.productId) where.productId = Number(query.productId)
    const today = new Date().toISOString().slice(0, 10)
    if (query.status === 'expired') {
      where.status = 'approved'
      where.validUntil = { [Op.lt]: today }
    } else if (query.status === 'approved') {
      where.status = 'approved'
      where.validUntil = { [Op.gte]: today }
    } else if (query.status) {
      where.status = String(query.status)
    }
    if (query.startDate || query.endDate) {
      where.inspectionDate = {}
      if (query.startDate) where.inspectionDate[Op.gte] = String(query.startDate)
      if (query.endDate) where.inspectionDate[Op.lte] = String(query.endDate)
    }
    return where
  }

  async listReports(query, permissions) {
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const { rows, count } = await this.app.model.QualityReport.findAndCountAll({
      where: this.reportWhere(query),
      include: this.reportInclude(),
      distinct: true,
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    })
    return {
      items: rows.map((item) => this.reportJson(item, permissions)),
      total: count,
      page,
      pageSize,
    }
  }

  async getReport(id, permissions = null) {
    const item = await this.app.model.QualityReport.findByPk(id, {
      include: this.reportInclude(),
    })
    return item ? this.reportJson(item, permissions) : null
  }

  async normalizedResults(value, transaction) {
    // 以启用中的检测项目定义为准，保存名称和标准快照以保留历史语义。
    const rawItems = parseResultItems(value)
    const ids = [...new Set(rawItems.map((item) => positiveInteger(item.itemId, '检测项目')))]
    const definitions = await this.app.model.QualityInspectionItem.findAll({
      where: { id: ids, status: 'enabled' },
      transaction,
    })
    if (definitions.length !== ids.length) invalid('检测项目不存在或已停用')
    const definitionMap = new Map(definitions.map((item) => [Number(item.id), item]))
    return rawItems.map((item) => {
      const definition = definitionMap.get(Number(item.itemId))
      const conclusion = String(item.conclusion || '')
      if (!conclusions.has(conclusion)) invalid('检测项目结论无效')
      return {
        itemId: Number(definition.id),
        code: definition.code,
        name: definition.name,
        category: definition.category,
        standardRequirement: definition.standardRequirement,
        unit: definition.unit || '',
        resultValue: required(item.resultValue, `${definition.name}检测结果`, 120),
        conclusion,
        remark: String(item.remark || '').trim().slice(0, 300),
      }
    })
  }

  async createReport(value, file) {
    // PDF 先写入磁盘，数据库事务失败时通过 catch 补偿删除物理文件。
    if (!file || file.mime !== 'application/pdf') invalid('请上传 PDF 检测报告')
    const inspectionDate = validDate(value.inspectionDate, '检测日期')
    const validUntil = validDate(value.validUntil, '有效期')
    if (validUntil < inspectionDate) invalid('有效期不能早于检测日期')
    const productId = positiveInteger(value.productId, '产品')
    const product = await this.app.model.Product.findByPk(productId)
    if (!product) invalid('所选产品不存在')

    const storedName = `${crypto.randomUUID()}.pdf`
    const uploadDir = path.join(this.app.baseDir, 'storage', 'uploads')
    const targetPath = path.join(uploadDir, storedName)
    await fsp.mkdir(uploadDir, { recursive: true })
    await fsp.copyFile(file.filepath, targetPath)

    try {
      const reportId = await this.app.model.transaction(async (transaction) => {
        const resultItems = await this.normalizedResults(value.resultItems, transaction)
        // 任一检测项目不合格时，整份报告结论即为不合格。
        const conclusion = resultItems.some((item) => item.conclusion === 'unqualified')
          ? 'unqualified'
          : 'qualified'
        const fileItem = await this.app.model.File.create({
          originalName: file.filename,
          storedName,
          mimeType: file.mime,
          category: 'report',
          size: (await fsp.stat(file.filepath)).size,
          uploadedBy: this.ctx.state.user.id,
        }, { transaction })
        const item = await this.app.model.QualityReport.create({
          reportNo: `QR${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
          name: required(value.name, '报告名称', 160),
          productId,
          institution: required(value.institution, '检测机构', 160),
          inspectionNo: required(value.inspectionNo, '检测编号', 80),
          inspectionDate,
          validUntil,
          fileId: fileItem.id,
          conclusion,
          status: 'pending',
          resultItems,
          remarks: String(value.remarks || '').trim().slice(0, 500),
          submittedBy: this.ctx.state.user.id,
        }, { transaction })
        await this.log('上传检测报告', 'quality_report', item.id, {
          reportNo: item.reportNo,
          status: item.status,
          conclusion,
        }, transaction)
        return Number(item.id)
      })
      return this.getReport(reportId)
    } catch (error) {
      await fsp.unlink(targetPath).catch(() => undefined)
      throw error
    }
  }

  async reviewReport(id, value) {
    // 仅待审核报告允许处理，防止重复审核覆盖原审核人和时间。
    const status = String(value.status || '')
    if (!reportStatuses.has(status)) invalid('审核状态无效')
    const item = await this.app.model.QualityReport.findByPk(id)
    if (!item) return null
    if (item.status !== 'pending') invalid('该报告已完成审核，不能重复操作')
    await item.update({
      status,
      reviewedBy: this.ctx.state.user.id,
      reviewedAt: new Date(),
      remarks: value.note
        ? `${item.remarks ? `${item.remarks}\n` : ''}审核意见：${String(value.note).trim().slice(0, 300)}`
        : item.remarks,
    })
    await this.log(status === 'approved' ? '审核通过检测报告' : '驳回检测报告', 'quality_report', item.id, {
      reportNo: item.reportNo,
      status,
      note: String(value.note || '').trim(),
    })
    return this.getReport(id)
  }

  async getReportFile(id) {
    // 下载前确认数据库关联和物理文件均存在，并记录下载审计日志。
    const report = await this.app.model.QualityReport.findByPk(id, {
      include: [{ model: this.app.model.File, as: 'file' }],
    })
    if (!report?.file) return null
    const filePath = path.join(this.app.baseDir, 'storage', 'uploads', report.file.storedName)
    try {
      await fsp.access(filePath)
    } catch {
      return null
    }
    await this.log('下载检测报告', 'quality_report', report.id, {
      reportNo: report.reportNo,
      fileName: report.file.originalName,
    })
    return { item: report.file, stream: fs.createReadStream(filePath) }
  }

  async listItems(query) {
    const keyword = String(query.keyword || '').trim()
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const where = {}
    if (keyword) {
      where[Op.or] = ['code', 'name', 'category', 'standardRequirement']
        .map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
    }
    if (query.status) where.status = String(query.status)
    const { rows, count } = await this.app.model.QualityInspectionItem.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    })
    return {
      items: rows.map((item) => this.itemJson(item)),
      total: count,
      page,
      pageSize,
    }
  }

  itemPayload(value, allowCode = true) {
    const payload = {
      name: required(value.name, '检测项目名称', 120),
      category: required(value.category, '项目分类', 80),
      standardRequirement: required(value.standardRequirement, '标准要求', 500),
      unit: String(value.unit || '').trim().slice(0, 30),
      status: itemStatuses.has(value.status) ? value.status : 'enabled',
    }
    if (allowCode) payload.code = required(value.code, '项目编号', 40).toUpperCase()
    return payload
  }

  async createItem(value) {
    const item = await this.app.model.QualityInspectionItem.create({
      ...this.itemPayload(value),
      createdBy: this.ctx.state.user.id,
    })
    await this.log('新增检测项目', 'quality_item', item.id, {
      code: item.code,
      status: item.status,
    })
    return this.itemJson(item)
  }

  async updateItem(id, value) {
    const item = await this.app.model.QualityInspectionItem.findByPk(id)
    if (!item) return null
    await item.update(this.itemPayload(value, false))
    await this.log('编辑检测项目', 'quality_item', item.id, {
      code: item.code,
      status: item.status,
    })
    return this.itemJson(item)
  }

  async updateItemStatus(id, status) {
    if (!itemStatuses.has(status)) invalid('状态值无效')
    const item = await this.app.model.QualityInspectionItem.findByPk(id)
    if (!item) return null
    const before = item.status
    await item.update({ status })
    await this.log('更新检测项目状态', 'quality_item', item.id, {
      code: item.code,
      before,
      status,
    })
    return this.itemJson(item)
  }

  async history(query) {
    const keyword = String(query.keyword || '').trim()
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const where = { module: '检测中心' }
    if (query.action) where.action = String(query.action)
    if (keyword) {
      where[Op.or] = ['action', 'targetType']
        .map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt[Op.gte] = new Date(`${query.startDate}T00:00:00+08:00`)
      if (query.endDate) where.createdAt[Op.lte] = new Date(`${query.endDate}T23:59:59+08:00`)
    }
    const { rows, count } = await this.app.model.OperationLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit: pageSize,
      offset,
    })
    const employeeIds = [...new Set(rows.map((item) => Number(item.employeeId)).filter(Boolean))]
    const employees = employeeIds.length
      ? await this.app.model.Employee.findAll({ where: { id: employeeIds }, attributes: ['id', 'name', 'account'] })
      : []
    const employeeMap = new Map(employees.map((item) => [Number(item.id), item]))
    return {
      items: rows.map((item) => {
        const employee = employeeMap.get(Number(item.employeeId))
        const context = item.detail?.context || {}
        return {
          id: Number(item.id),
          targetType: item.targetType,
          targetId: item.targetId ? Number(item.targetId) : null,
          targetNo: context.reportNo || context.code || '-',
          action: item.action,
          status: context.status || '-',
          note: context.note || '-',
          operator: employee ? `${employee.name}（${employee.account}）` : '系统',
          ip: item.ip || '-',
          createdAt: this.ctx.helper.formatDateTime(item.createdAt),
        }
      }),
      total: count,
      page,
      pageSize,
    }
  }
}

module.exports = QualityService
