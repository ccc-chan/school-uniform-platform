'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Op, QueryTypes } = require('sequelize')
const { Service } = require('egg')

const fieldMap = {
  imageId: 'product.field.image',
  code: 'product.field.code',
  name: 'product.field.name',
  category: 'product.field.category',
  season: 'product.field.season',
  status: 'product.field.status',
  createdAt: 'product.field.created_at',
}

/**
 * 管理产品档案、产品图片和关联生产/二维码概览。
 */
class ProductsService extends Service {
  json(item, permissions = null) {
    const data = {
      id: Number(item.id),
      imageId: item.imageId ? Number(item.imageId) : null,
      code: item.code,
      name: item.name,
      category: item.category,
      qrCodeType: item.qrCodeType,
      applicableSchools: item.applicableSchools || [],
      season: item.season,
      style: item.style,
      color: item.color,
      sizes: item.sizes || [],
      fabricInfo: item.fabricInfo || '',
      executionStandard: item.executionStandard || '',
      washingInstructions: item.washingInstructions || '',
      status: item.status,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
    }

    if (permissions) {
      for (const [key, code] of Object.entries(fieldMap)) {
        if (!permissions.includes(code)) delete data[key]
      }
    }

    return data
  }

  async log(action, item, context = {}) {
    const row = await this.app.model.OperationLog.create({
      employeeId: this.ctx.state.user.id,
      module: '产品中心',
      action,
      targetType: 'product',
      targetId: item.id,
      detail: {
        request: {
          method: this.ctx.method,
          path: this.ctx.path,
          params: this.ctx.params,
          query: this.ctx.query,
          body: this.ctx.request.body,
        },
        response: null,
        context: { code: item.code, name: item.name, ...context },
      },
      ip: this.ctx.ip,
    })

    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(row.id))
  }
  async list(query, permissions) {
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const where = {}

    if (query.keyword) {
      where[Op.or] = ['code', 'name'].map((key) => ({
        [key]: {
          [Op.like]: `%${String(query.keyword).trim()}%`,
        },
      }))
    }
    if (query.category) where.category = query.category
    if (['product', 'batch', 'school'].includes(query.qrCodeType)) {
      where.qrCodeType = query.qrCodeType
    }
    if (query.status) where.status = query.status

    const { rows, count } =
      await this.app.model.Product.findAndCountAll({
        where,
        order: [['id', 'DESC']],
        limit: pageSize,
        offset,
      })

    const productIds = rows.map((item) => Number(item.id))
    const summaryRows = productIds.length
      ? await this.app.model.ProductionBatch.findAll({
          attributes: [
            'productId',
            [this.app.Sequelize.fn('COUNT', this.app.Sequelize.col('id')), 'batchCount'],
            [this.app.Sequelize.fn('SUM', this.app.Sequelize.col('quantity')), 'totalQuantity'],
          ],
          where: { productId: { [Op.in]: productIds } },
          group: ['productId'],
          raw: true,
        })
      : []

    const summaryMap = new Map(
      summaryRows.map((item) => [
        Number(item.productId),
        {
          batchCount: Number(item.batchCount || 0),
          totalQuantity: Number(item.totalQuantity || 0),
        },
      ]),
    )

    const canViewProduction = permissions.includes('production.view')
    const canViewQuantity = permissions.includes('production.field.quantity')

    return {
      items: rows.map((item) => {
        const data = this.json(item, permissions)
        if (canViewProduction) {
          const summary = summaryMap.get(Number(item.id))
          data.batchCount = summary?.batchCount || 0
          if (canViewQuantity) data.totalQuantity = summary?.totalQuantity || 0
        }
        return data
      }),
      total: count,
      page,
      pageSize,
    }
  }
  async get(id) {
    const item = await this.app.model.Product.findByPk(id)
    return item ? this.json(item) : null
  }

  async detail(id, permissions) {
    const product = await this.app.model.Product.findByPk(id)
    if (!product) return null

    const canViewProduction = permissions.includes('production.view')
    const canViewQr = permissions.includes('qrcode.view')
    const canViewQuality = permissions.includes('quality.view')

    const [rows, qualityRows] = await Promise.all([
      canViewProduction
        ? this.app.model.ProductionBatch.findAll({
            where: { productId: id },
            include: [
              { model: this.app.model.ProductionFactory, as: 'factory', attributes: ['id', 'name'] },
              { model: this.app.model.Employee, as: 'responsibleEmployee', attributes: ['id', 'name'] },
            ],
            order: [['productionDate', 'DESC'], ['id', 'DESC']],
          })
        : [],
      canViewQuality
        ? this.app.model.QualityReport.findAll({
            where: { productId: id },
            include: this.ctx.service.quality.reportInclude(),
            order: [['id', 'DESC']],
          })
        : [],
    ])

    const batchNos = rows.map((item) => item.batchNo)
    const batchIds = rows.map((item) => Number(item.id))

    const qrRows =
      canViewQr && batchNos.length
        ? await this.app.model.query(
            `SELECT
              q.production_batch AS productionBatch,
              g.id AS generationBatchId,
              g.batch_no AS generationBatchNo,
              COUNT(q.id) AS total,
              SUM(q.status='bound') AS bound,
              SUM(q.status='activated') AS activated,
              SUM(q.status='voided') AS voided,
              SUM(COALESCE(scans.total, 0)) AS scans
            FROM qr_codes q
            JOIN qr_generation_batches g ON g.id = q.generation_batch_id
            LEFT JOIN (
              SELECT qr_code_id, COUNT(*) AS total
              FROM qr_scan_records
              GROUP BY qr_code_id
            ) scans ON scans.qr_code_id = q.id
            WHERE q.product_id = :productId
              AND q.production_batch IN (:batchNos)
            GROUP BY q.production_batch, g.id, g.batch_no
            ORDER BY g.id DESC`,
            {
              replacements: { productId: id, batchNos },
              type: QueryTypes.SELECT,
            },
          )
        : []

    const productionRows = batchIds.length
      ? await this.app.model.ProductionRecord.findAll({
          where: { batchId: { [Op.in]: batchIds } },
          include: [
            { model: this.app.model.Employee, as: 'employee', attributes: ['id', 'name'] },
            {
              model: this.app.model.ProductionProcess,
              as: 'process',
              attributes: ['id', 'nodeName', 'nodeOrder'],
            },
          ],
          order: [['id', 'ASC']],
        })
      : []

    const groupedQrBatches = new Map()
    for (const row of qrRows) {
      const items = groupedQrBatches.get(row.productionBatch) || []
      items.push({
        id: Number(row.generationBatchId),
        batchNo: row.generationBatchNo,
        total: Number(row.total || 0),
        bound: Number(row.bound || 0),
        activated: Number(row.activated || 0),
        voided: Number(row.voided || 0),
        scans: Number(row.scans || 0),
      })
      groupedQrBatches.set(row.productionBatch, items)
    }

    const groupedProductionSteps = new Map()
    for (const item of productionRows) {
      const steps = groupedProductionSteps.get(Number(item.batchId)) || []
      const step = {
        id: Number(item.id),
        nodeName: item.content || item.process?.nodeName || '未命名工序',
        nodeOrder: item.process
          ? Number(item.process.nodeOrder || 0)
          : 100000 + Number(item.id),
        custom: !item.processId,
      }
      if (permissions.includes('production.field.status')) step.status = item.status
      if (permissions.includes('production.field.employee')) {
        step.employeeName = item.employee?.name || ''
      }
      if (permissions.includes('production.field.date')) {
        step.startedAt = this.ctx.helper.formatDateTime(item.startedAt)
        step.completedAt = this.ctx.helper.formatDateTime(item.completedAt)
      }
      steps.push(step)
      groupedProductionSteps.set(Number(item.batchId), steps)
    }
    for (const steps of groupedProductionSteps.values()) {
      steps.sort((left, right) =>
        left.nodeOrder - right.nodeOrder || left.id - right.id,
      )
    }

    return {
      product: this.json(product, permissions),
      batches: rows.map((item) => {
        const qrBatches = groupedQrBatches.get(item.batchNo) || []
        return {
          id: Number(item.id),
          batchNo: item.batchNo,
          ...(permissions.includes('production.field.quantity')
            ? { quantity: Number(item.quantity) }
            : {}),
          ...(permissions.includes('production.field.date')
            ? { productionDate: item.productionDate }
            : {}),
          ...(permissions.includes('production.field.status')
            ? { status: item.status }
            : {}),
          ...(permissions.includes('production.field.factory')
            ? { factoryName: item.factory?.name || '' }
            : {}),
          ...(permissions.includes('production.field.employee')
            ? { responsibleEmployeeName: item.responsibleEmployee?.name || '' }
            : {}),
          qrTotal: qrBatches.reduce((sum, row) => sum + row.total, 0),
          qrBatches: permissions.includes('qrcode.field.status') ? qrBatches : [],
          productionSteps: groupedProductionSteps.get(Number(item.id)) || [],
        }
      }),
      qualityReports: qualityRows.map((item) =>
        this.ctx.service.quality.reportJson(item, permissions),
      ),
      access: {
        production: canViewProduction,
        qrcode: canViewQr,
        quality: canViewQuality,
      },
    }
  }
  async saveImage(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mime)) {
      throw new Error('仅支持 JPG、PNG、WEBP 图片')
    }

    const ext = path.extname(file.filename).toLowerCase()
    const storedName = `${crypto.randomUUID()}${ext}`
    const dir = path.join(this.app.baseDir, 'storage', 'uploads')

    await fsp.mkdir(dir, { recursive: true })
    await fsp.copyFile(file.filepath, path.join(dir, storedName))

    return this.app.model.File.create({
      originalName: file.filename,
      storedName,
      mimeType: file.mime,
      category: 'product_image',
      size: (await fsp.stat(file.filepath)).size,
      uploadedBy: this.ctx.state.user.id,
    })
  }

  async create(value, file) {
    const image = await this.saveImage(file)

    try {
      const item = await this.app.model.Product.create({
        ...value,
        imageId: image.id,
        status: 'enabled',
      })

      await this.log('新增产品', item, {
        image: { id: Number(image.id), name: image.originalName },
      })

      return this.json(item)
    } catch (e) {
      await image.destroy()
      await fsp
        .unlink(path.join(this.app.baseDir, 'storage', 'uploads', image.storedName))
        .catch(() => {})
      throw e
    }
  }

  async update(id, value, file) {
    const item = await this.app.model.Product.findByPk(id)
    if (!item) return null

    const before = { ...item.toJSON() }
    const oldImageId = item.imageId

    let image = null
    if (file) image = await this.saveImage(file)

    await item.update({ ...value, ...(image ? { imageId: image.id } : {}) })

    await this.log('编辑产品', item, {
      changed: Object.keys(value).filter(
        (key) => JSON.stringify(before[key]) !== JSON.stringify(value[key]),
      ),
    })

    if (image && oldImageId) await this.removeImage(oldImageId)

    return this.json(item)
  }
  async updateStatus(id, status) {
    const item = await this.app.model.Product.findByPk(id)
    if (!item) return null

    const before = item.status
    await item.update({ status })
    await this.log('更新产品状态', item, { before, status })

    return this.json(item)
  }

  async getImage(id) {
    const item = await this.app.model.File.findOne({
      where: { id, category: 'product_image' },
    })
    if (!item) return null

    const target = path.join(this.app.baseDir, 'storage', 'uploads', item.storedName)
    try {
      await fsp.access(target)
    } catch {
      return null
    }

    return { item, stream: fs.createReadStream(target) }
  }

  async removeImage(id) {
    const item = await this.app.model.File.findByPk(id)
    if (!item) return

    await item.destroy()
    await fsp
      .unlink(path.join(this.app.baseDir, 'storage', 'uploads', item.storedName))
      .catch(() => {})
  }

  async destroy(id) {
    const item = await this.app.model.Product.findByPk(id)
    if (!item) return null

    const imageId = item.imageId
    await this.log('删除产品', item)
    await item.destroy()

    if (imageId) await this.removeImage(imageId)

    return true
  }
}

module.exports = ProductsService
