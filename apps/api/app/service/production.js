'use strict'

const crypto = require('node:crypto')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Op } = require('sequelize')
const { Service } = require('egg')

const batchStepStatuses = new Set(['pending', 'in_progress', 'completed'])

const batchStepPhotoExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const batchReportExtensions = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

const batchExecutionStandards = new Set([
  'GB/T 31888-2015《中小学生校服》',
])

const batchSafetyCategories = new Set([
  'GB 18401-2010《国家纺织产品基本安全技术规范》B类',
  'GB 31701-2015《婴幼儿及儿童纺织产品安全技术规范》B类',
])

const statuses = {
  orders: new Set([
    'pending',
    'producing',
    'completed',
    'warehoused',
  ]),
  batches: new Set(['planned', 'in_progress', 'paused', 'completed']),
  processes: new Set(['enabled', 'disabled']),
  records: new Set(['pending', 'in_progress', 'completed', 'exception']),
  outbounds: new Set(['pending', 'shipped', 'received', 'cancelled']),
}

const fieldPermissions = {
  customerName: 'production.field.customer',
  productId: 'production.field.product',
  productCode: 'production.field.product',
  productName: 'production.field.product',
  quantity: 'production.field.quantity',
  deliveryDate: 'production.field.date',
  productionDate: 'production.field.date',
  outboundDate: 'production.field.date',
  startedAt: 'production.field.date',
  completedAt: 'production.field.date',
  factoryName: 'production.field.factory',
  responsibleEmployeeId: 'production.field.employee',
  responsibleEmployeeName: 'production.field.employee',
  employeeId: 'production.field.employee',
  employeeName: 'production.field.employee',
  handledBy: 'production.field.employee',
  handlerName: 'production.field.employee',
  status: 'production.field.status',
}

function invalid(message, status = 400) {
  const error = new Error(message)
  error.status = status
  throw error
}

function positiveInteger(value, label) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) invalid(`${label}必须为正整数`)
  return number
}

function required(value, label, max = 255) {
  const text = String(value || '').trim()
  if (!text) invalid(`请填写${label}`)
  if (text.length > max) invalid(`${label}不能超过 ${max} 个字符`)
  return text
}

function validDate(value, label) {
  const text = required(value, label, 30)
  if (Number.isNaN(new Date(text).getTime())) invalid(`${label}格式不正确`)
  return text
}

/**
 * 统一管理五类生产资源及其关联校验、字段权限和审计日志。
 */
class ProductionService extends Service {
  // 将路由资源名映射到对应 Sequelize 模型。
  model(resource) {
    const models = {
      orders: this.app.model.ProductionOrder,
      batches: this.app.model.ProductionBatch,
      processes: this.app.model.ProductionProcess,
      records: this.app.model.ProductionRecord,
      outbounds: this.app.model.ProductionOutbound,
    }
    const model = models[resource]
    if (!model) invalid('生产资源类型无效', 404)
    return model
  }

  include(resource) {
    const model = this.app.model
    if (resource === 'orders')
      return [
        {
          model: model.Product,
          as: 'product',
          attributes: [
            'id', 'code', 'name', 'imageId', 'style', 'category',
            'safetyCategory', 'executionStandard', 'fabricInfo', 'qrCodeType',
          ],
        },
        { model: model.Company, as: 'company', attributes: ['id', 'name'] },
      ]
    if (resource === 'batches')
      return [
        {
          model: model.ProductionOrder,
          as: 'order',
          attributes: ['id', 'orderNo'],
        },
        {
          model: model.Product,
          as: 'product',
          attributes: ['id', 'code', 'name'],
        },
        {
          model: model.Employee,
          as: 'responsibleEmployee',
          attributes: ['id', 'name'],
        },
        {
          model: model.File,
          as: 'qualityReportFile',
          attributes: ['id', 'originalName', 'size'],
        },
      ]
    if (resource === 'records')
      return [
        {
          model: model.ProductionBatch,
          as: 'batch',
          attributes: ['id', 'batchNo'],
        },
        { model: model.Employee, as: 'employee', attributes: ['id', 'name'] },
        {
          model: model.ProductionProcess,
          as: 'process',
          attributes: ['id', 'flowName', 'nodeName'],
        },
      ]
    if (resource === 'outbounds')
      return [
        {
          model: model.ProductionBatch,
          as: 'batch',
          attributes: ['id', 'batchNo', 'quantity'],
        },
        { model: model.Employee, as: 'handler', attributes: ['id', 'name'] },
      ]
    return []
  }

  json(resource, item, permissions = null) {
    // 先构建完整响应，再按字段权限删除受控信息。
    const base = {
      id: Number(item.id),
      status: item.status,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
      updatedAt: this.ctx.helper.formatDateTime(item.updatedAt),
    }
    const values = {
      orders: {
        orderNo: item.orderNo,
        productId: Number(item.productId),
        companyId: item.companyId ? Number(item.companyId) : null,
        companyName: item.company?.name || '',
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        productCode: item.product?.code || '',
        productName: item.product?.name || '',
        productImageId: item.product?.imageId ? Number(item.product.imageId) : null,
        style: item.product?.style || '',
        category: item.product?.category || '',
        safetyCategory: item.product?.safetyCategory || '',
        executionStandard: item.product?.executionStandard || '',
        fabricSummary: item.product?.fabricInfo || '',
        qrCodeType: item.product?.qrCodeType || '',
        productionQuantity: Number(item.get?.('productionQuantity') || 0),
        batchCount: Number(item.get?.('batchCount') || 0),
        qualityStatus: item.get?.('qualityStatus') || 'missing',
        inspectionStatus: item.get?.('inspectionStatus') || 'missing',
        notes: item.notes || '',
      },
      batches: {
        batchNo: item.batchNo,
        orderId: item.orderId ? Number(item.orderId) : undefined,
        orderNo: item.orderNo || item.order?.orderNo || '',
        productId: Number(item.productId),
        productCode: item.product?.code || '',
        productName: item.product?.name || '',
        quantity: Number(item.quantity),
        productionDate: item.productionDate,
        executionStandard: item.executionStandard || '',
        safetyCategory: item.safetyCategory || '',
        fabricComponents: Array.isArray(item.fabricComponents)
          ? item.fabricComponents
          : [],
        fabricRatio: item.fabricRatio || '',
        fabricItems: Array.isArray(item.fabricComponents)
          ? item.fabricComponents.map((entry, index) =>
              typeof entry === 'string'
                ? {
                    component: entry,
                    ratio: index === 0 ? item.fabricRatio || '' : '',
                  }
                : {
                    component: String(entry?.component || ''),
                    ratio: String(entry?.ratio || ''),
                  },
            )
          : [],
        qualityReportFileId: item.qualityReportFileId
          ? Number(item.qualityReportFileId)
          : null,
        qualityReportFileName: item.qualityReportFile?.originalName || '',
        qualityReportFileSize: Number(item.qualityReportFile?.size || 0),
        factoryName: item.factoryName || '',
        responsibleEmployeeId: item.responsibleEmployeeId
          ? Number(item.responsibleEmployeeId)
          : undefined,
        responsibleEmployeeName:
          item.responsibleEmployeeName || item.responsibleEmployee?.name || '',
        notes: item.notes || '',
      },
      processes: {
        flowName: item.flowName,
        nodeName: item.nodeName,
        nodeOrder: Number(item.nodeOrder),
        description: item.description || '',
        consumerVisible: Boolean(item.consumerVisible),
      },
      records: {
        batchId: Number(item.batchId),
        batchNo: item.batch?.batchNo || '',
        employeeId: Number(item.employeeId),
        employeeName: item.operatorName || item.employee?.name || '',
        processId: Number(item.processId),
        processName: item.process
          ? `${item.process.flowName} / ${item.process.nodeName}`
          : '',
        content: item.content || item.process?.nodeName || '',
        quantity: Number(item.quantity),
        startedAt: this.ctx.helper.formatDateTime(item.startedAt),
        completedAt: this.ctx.helper.formatDateTime(item.completedAt),
        notes: item.notes || '',
      },
      outbounds: {
        outboundNo: item.outboundNo,
        batchId: Number(item.batchId),
        batchNo: item.batch?.batchNo || '',
        quantity: Number(item.quantity),
        outboundDate: item.outboundDate,
        recipient: item.recipient,
        destination: item.destination,
        handledBy: Number(item.handledBy),
        handlerName: item.handler?.name || '',
        notes: item.notes || '',
      },
    }
    const data = { ...base, ...values[resource] }
    if (permissions) {
      const hasPermission = (code) =>
        permissions.includes(code) ||
        permissions.includes(
          this.ctx.service.auth.genericPermissionCode(code),
        )

      for (const [key, permission] of Object.entries(fieldPermissions)) {
        if (!hasPermission(permission)) delete data[key]
      }
    }
    return data
  }

  async log(action, resource, item, detail = null, transaction = null) {
    const log = await this.app.model.OperationLog.create(
      {
        employeeId: this.ctx.state.user.id,
        module: '生产中心',
        action,
        targetType: `production_${resource}`,
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
          context: detail,
        },
        ip: this.ctx.ip,
      },
      { transaction },
    )
    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(log.id))
  }

  number(prefix) {
    // 编号由时间戳和三位随机数组成，最终唯一性仍由数据库约束保证。
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    return `${prefix}${stamp}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  }

  async workOrderNumber(transaction) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const prefix = `WO${year}${month}${day}`
    const latest = await this.app.model.ProductionOrder.findOne({
      where: { orderNo: { [Op.like]: `${prefix}%` } },
      attributes: ['orderNo'],
      order: [['orderNo', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    const sequence = Number(String(latest?.orderNo || '').slice(-2)) + 1
    if (sequence > 99) invalid('当日工单数量已达上限')
    return `${prefix}${String(sequence).padStart(2, '0')}`
  }

  async batchNumber(transaction) {
    const now = new Date()
    const prefix = `PC${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}`
    const latest = await this.app.model.ProductionBatch.findOne({
      where: { batchNo: { [Op.like]: `${prefix}%` } },
      attributes: ['batchNo'],
      order: [['batchNo', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    const sequence = Number(String(latest?.batchNo || '').slice(prefix.length)) + 1
    if (sequence > 999) invalid('当月生产批次数量已达上限')
    return `${prefix}${String(sequence).padStart(3, '0')}`
  }

  where(resource, query) {
    const keyword = String(query.keyword || '').trim()
    const where = {}
    if (query.status) where.status = String(query.status)
    if (!keyword) return where
    const like = { [Op.like]: `%${keyword}%` }
    const keys = {
      orders: ['orderNo', 'customerName', '$product.name$'],
      batches: [
        'batchNo',
        'orderNo',
        '$product.name$',
        'factoryName',
        'responsibleEmployeeName',
      ],
      processes: ['flowName', 'nodeName', 'description'],
      records: [
        'content',
        '$batch.batch_no$',
        '$employee.name$',
        '$process.node_name$',
      ],
      outbounds: ['outboundNo', 'recipient', 'destination', '$batch.batch_no$'],
    }[resource]
    where[Op.or] = keys.map((key) => ({ [key]: like }))
    return where
  }

  orderWhere(query) {
    const where = {}
    const sequelize = this.app.model.ProductionOrder.sequelize
    const conditions = []
    const keyword = String(query.keyword || '').trim()
    if (query.status) where.status = String(query.status)
    if (keyword) {
      const like = { [Op.like]: `%${keyword}%` }
      conditions.push({
        [Op.or]: [
          { '$product.name$': like },
          { '$product.code$': like },
        ],
      })
    }
    if (query.safetyCategory) where['$product.safetyCategory$'] = String(query.safetyCategory)
    if (query.qrCodeType) where['$product.qrCodeType$'] = String(query.qrCodeType)
    if (query.batchNo) {
      const value = sequelize.escape(`%${String(query.batchNo).trim()}%`)
      conditions.push(sequelize.literal(
        `EXISTS (SELECT 1 FROM production_batches pb WHERE pb.order_id = ProductionOrder.id AND pb.batch_no LIKE ${value})`,
      ))
    }
    if (query.qualityReport === 'uploaded') {
      conditions.push(sequelize.literal(
        'EXISTS (SELECT 1 FROM quality_reports qr WHERE qr.product_id = ProductionOrder.product_id)',
      ))
    }
    if (query.qualityReport === 'missing') {
      conditions.push(sequelize.literal(
        'NOT EXISTS (SELECT 1 FROM quality_reports qr WHERE qr.product_id = ProductionOrder.product_id)',
      ))
    }
    if (conditions.length) where[Op.and] = conditions
    return where
  }

  async list(resource, query, permissions) {
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const attributes = resource === 'orders'
      ? {
          include: [
            [this.app.model.ProductionOrder.sequelize.literal('(SELECT COALESCE(SUM(pb.quantity), 0) FROM production_batches pb WHERE pb.order_id = ProductionOrder.id)'), 'productionQuantity'],
            [this.app.model.ProductionOrder.sequelize.literal('(SELECT COUNT(*) FROM production_batches pb WHERE pb.order_id = ProductionOrder.id)'), 'batchCount'],
            [this.app.model.ProductionOrder.sequelize.literal("COALESCE((SELECT qr.conclusion FROM quality_reports qr WHERE qr.product_id = ProductionOrder.product_id ORDER BY qr.id DESC LIMIT 1), 'missing')"), 'qualityStatus'],
            [this.app.model.ProductionOrder.sequelize.literal("COALESCE((SELECT qr.status FROM quality_reports qr WHERE qr.product_id = ProductionOrder.product_id ORDER BY qr.id DESC LIMIT 1), 'missing')"), 'inspectionStatus'],
          ],
        }
      : undefined
    const { rows, count } = await this.model(resource).findAndCountAll({
      where: resource === 'orders' ? this.orderWhere(query) : this.where(resource, query),
      attributes,
      include: this.include(resource),
      distinct: true,
      subQuery: resource === 'orders' ? false : undefined,
      order:
        resource === 'processes'
          ? [
              ['flowName', 'ASC'],
              ['nodeOrder', 'ASC'],
            ]
          : [['id', 'DESC']],
      limit: pageSize,
      offset,
    })
    return {
      items: rows.map((item) => this.json(resource, item, permissions)),
      total: count,
      page,
      pageSize,
    }
  }

  async get(resource, id, permissions = null) {
    const item = await this.model(resource).findByPk(id, {
      include: this.include(resource),
    })
    return item ? this.json(resource, item, permissions) : null
  }

  async options() {
    const model = this.app.model
    const [products, employees, orders, batches, processes] = await Promise.all([
      model.Product.findAll({
        where: { status: 'enabled' },
        attributes: ['id', 'code', 'name'],
        order: [['name', 'ASC']],
      }),
      model.Employee.findAll({
        where: { status: 'enabled' },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
      }),
      model.ProductionOrder.findAll({
        include: this.include('orders'),
        order: [['id', 'DESC']],
      }),
      model.ProductionBatch.findAll({
        attributes: ['id', 'batchNo', 'quantity'],
        order: [['id', 'DESC']],
      }),
      model.ProductionProcess.findAll({
        where: { status: 'enabled' },
        attributes: ['id', 'nodeName'],
        order: [['nodeOrder', 'ASC'], ['id', 'ASC']],
      }),
    ])
    return {
      products: products.map((item) => ({
        id: Number(item.id),
        code: item.code,
        name: item.name,
      })),
      employees: employees.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
      orders: orders.map((item) => ({
        id: Number(item.id),
        orderNo: item.orderNo,
        productId: Number(item.productId),
        productName: item.product?.name || '',
        quantity: Number(item.quantity || 0),
      })),
      batches: batches.map((item) => ({
        id: Number(item.id),
        batchNo: item.batchNo,
        quantity: Number(item.quantity),
      })),
      processes: processes.map((item) => ({
        id: Number(item.id),
        name: item.nodeName,
      })),
    }
  }

  payload(resource, value) {
    // 按资源类型归一化请求字段，并执行格式、范围和状态校验。
    const status = String(value.status || [...statuses[resource]][0])
    if (!statuses[resource].has(status)) invalid('状态值无效')
    if (resource === 'orders')
      return {
        productId: positiveInteger(value.productId, '产品'),
        companyId: positiveInteger(value.companyId, '企业'),
        sizes: Array.isArray(value.sizes)
          ? [...new Set(value.sizes.map(item => String(item)))].filter(item => /^(12[05]|1[3-9][05]|200)$/.test(item))
          : [],
        status,
        notes: String(value.notes || '')
          .trim()
          .slice(0, 500),
      }
    if (resource === 'processes')
      return {
        flowName: required(value.flowName, '流程名称', 100),
        nodeName: required(value.nodeName, '节点名称', 100),
        nodeOrder: positiveInteger(value.nodeOrder, '节点排序'),
        description: String(value.description || '')
          .trim()
          .slice(0, 500),
        consumerVisible: Boolean(value.consumerVisible),
        status,
      }
    if (resource === 'batches')
      return {
        orderId: null,
        orderNo: required(value.orderNo, '生产订单', 120),
        productId: positiveInteger(value.productId, '生产产品'),
        quantity: positiveInteger(value.quantity, '生产数量'),
        productionDate: validDate(value.productionDate, '生产日期'),
        factoryName: required(value.factoryName, '生产工厂', 120),
        responsibleEmployeeId: null,
        responsibleEmployeeName: required(
          value.responsibleEmployeeName,
          '负责人',
          80,
        ),
        status,
        notes: String(value.notes || '')
          .trim()
          .slice(0, 500),
      }
    if (resource === 'records') {
      const startedAt = validDate(value.startedAt, '开始时间')
      const completedAt = value.completedAt
        ? validDate(value.completedAt, '完成时间')
        : null
      if (completedAt && new Date(completedAt) < new Date(startedAt))
        invalid('完成时间不能早于开始时间')
      return {
        batchId: positiveInteger(value.batchId, '生产批次'),
        employeeId: positiveInteger(value.employeeId, '员工'),
        processId: positiveInteger(value.processId, '工序'),
        quantity: positiveInteger(value.quantity, '完成数量'),
        startedAt,
        completedAt,
        status,
        notes: String(value.notes || '')
          .trim()
          .slice(0, 500),
      }
    }
    return {
      batchId: positiveInteger(value.batchId, '生产批次'),
      quantity: positiveInteger(value.quantity, '出厂数量'),
      outboundDate: validDate(value.outboundDate, '出厂日期'),
      recipient: required(value.recipient, '收货单位', 120),
      destination: required(value.destination, '目的地', 255),
      handledBy: positiveInteger(value.handledBy, '经办人'),
      status,
      notes: String(value.notes || '')
        .trim()
        .slice(0, 500),
    }
  }

  async validateRelations(
    resource,
    payload,
    currentId = 0,
    transaction = null,
  ) {
    // 在写入事务内检查关联对象及累计数量，降低并发修改造成的数据不一致。
    const model = this.app.model
    if (resource === 'orders') {
      const [product, company] = await Promise.all([
        model.Product.findByPk(payload.productId, { transaction }),
        model.Company.findByPk(payload.companyId, { transaction }),
      ])
      if (!product) invalid('所选产品不存在')
      if (!company) invalid('所选企业不存在')
      if (!payload.sizes.length) invalid('请选择型号尺码')
      if (currentId) {
        const current = await model.ProductionOrder.findByPk(currentId, {
          transaction,
        })
        const allocated = Number((await model.ProductionBatch.count({ where: { orderId: currentId }, transaction })) || 0)
        if (
          allocated > 0 &&
          current &&
          Number(current.productId) !== payload.productId
        ) {
          invalid('已有生产批次的订单不能更换产品')
        }
      }
      return payload
    }
    if (resource === 'batches') {
      if (!(await model.Product.findByPk(payload.productId, { transaction }))) {
        invalid('生产产品不存在')
      }
      return payload
    }
    if (resource === 'records') {
      const [batch, employee, process] = await Promise.all([
        model.ProductionBatch.findByPk(payload.batchId, { transaction }),
        model.Employee.findOne({
          where: { id: payload.employeeId, status: 'enabled' },
          transaction,
        }),
        model.ProductionProcess.findOne({
          where: { id: payload.processId, status: 'enabled' },
          transaction,
        }),
      ])
      if (!batch) invalid('所选生产批次不存在')
      if (payload.quantity > Number(batch.quantity))
        invalid('生产记录数量不能超过批次数量')
      if (!employee) invalid('所选员工不存在或已停用')
      if (!process) invalid('所选工序不存在或已停用')
    }
    if (resource === 'outbounds') {
      const batch = await model.ProductionBatch.findByPk(payload.batchId, {
        transaction,
      })
      if (!batch) invalid('所选生产批次不存在')
      const shipped = Number(
        (await model.ProductionOutbound.sum('quantity', {
          where: {
            batchId: batch.id,
            id: { [Op.ne]: currentId || 0 },
            status: { [Op.ne]: 'cancelled' },
          },
          transaction,
        })) || 0,
      )
      if (
        payload.status !== 'cancelled' &&
        shipped + payload.quantity > Number(batch.quantity)
      )
        invalid('累计出厂数量不能超过生产批次数量')
      if (
        !(await model.Employee.findOne({
          where: { id: payload.handledBy, status: 'enabled' },
          transaction,
        }))
      )
        invalid('所选经办人不存在或已停用')
    }
    return payload
  }

  async create(resource, value) {
    // 业务数据和操作日志在同一事务中创建，任一步失败都会回滚。
    const id = await this.app.model.transaction(async (transaction) => {
      let payload = this.payload(resource, value)
      payload = await this.validateRelations(resource, payload, 0, transaction)
      if (resource === 'orders') payload.orderNo = await this.workOrderNumber(transaction)
      if (resource === 'batches') payload.batchNo = this.number('PB')
      if (resource === 'outbounds') payload.outboundNo = this.number('OUT')
      const item = await this.model(resource).create(
        { ...payload, createdBy: this.ctx.state.user.id },
        { transaction },
      )
      await this.log(`新增${resource}`, resource, item, payload, transaction)
      return Number(item.id)
    })
    return this.get(resource, id)
  }

  async createOrderBatch(orderId, value, file = null) {
    return this.createScopedBatch({ orderId }, value, file)
  }

  async createProductBatch(productId, value, file = null) {
    return this.createScopedBatch({ productId }, value, file)
  }

  async createScopedBatch(scope, value, file = null) {
    const quantity = positiveInteger(value.quantity, '生产数量')
    const productionDate = validDate(value.productionDate, '生产日期')
    const executionStandard = required(value.executionStandard, '执行标准', 160)
    const safetyCategory = required(value.safetyCategory, '安全类别', 255)
    if (!batchExecutionStandards.has(executionStandard)) invalid('执行标准无效')
    if (!batchSafetyCategories.has(safetyCategory)) invalid('安全类别无效')

    const fabricItems = Array.isArray(value.fabricItems)
      ? value.fabricItems
        .map((item) => ({
          component: String(item?.component || '').trim(),
          ratio: String(item?.ratio || '').trim(),
        }))
        .filter((item) => item.component || item.ratio)
        .slice(0, 12)
      : []
    if (fabricItems.some((item) => !item.component || !item.ratio)) {
      invalid('每行面料成分与面料配比需同时填写')
    }
    if (fabricItems.some((item) => item.component.length > 40)) {
      invalid('单个面料成分不能超过 40 个字符')
    }
    if (fabricItems.some((item) => item.ratio.length > 60)) {
      invalid('单个面料配比不能超过 60 个字符')
    }

    let reportStat = null
    let reportPath = ''
    let reportStoredName = ''
    if (file) {
      const extension = batchReportExtensions[file.mime]
      if (!extension) invalid('质检报告仅支持 PNG、JPG、JPEG 或 PDF')
      reportStat = await fsp.stat(file.filepath)
      if (reportStat.size > 10 * 1024 * 1024) invalid('质检报告不能超过 10MB')
      reportStoredName = `${crypto.randomUUID()}${extension}`
      const uploadDir = path.join(this.app.baseDir, 'storage', 'uploads')
      reportPath = path.join(uploadDir, reportStoredName)
      await fsp.mkdir(uploadDir, { recursive: true })
      await fsp.copyFile(file.filepath, reportPath)
    }

    try {
      const id = await this.app.model.transaction(async (transaction) => {
        const order = scope.orderId
          ? await this.app.model.ProductionOrder.findByPk(scope.orderId, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          : null
        if (scope.orderId && !order) invalid('生产工单不存在', 404)
        const productId = order?.productId || positiveInteger(scope.productId, '产品')
        if (!order && !(await this.app.model.Product.findByPk(productId, { transaction }))) {
          invalid('产品不存在', 404)
        }

        let qualityReportFileId = null
        if (file && reportStat) {
          const report = await this.app.model.File.create({
            originalName: file.filename,
            storedName: reportStoredName,
            mimeType: file.mime,
            category: 'production_batch_report',
            size: reportStat.size,
            uploadedBy: this.ctx.state.user.id,
          }, { transaction })
          qualityReportFileId = Number(report.id)
        }

        const item = await this.app.model.ProductionBatch.create({
          batchNo: await this.batchNumber(transaction),
          orderId: order ? Number(order.id) : null,
          orderNo: order?.orderNo || '',
          productId: Number(productId),
          quantity,
          productionDate,
          executionStandard,
          safetyCategory,
          fabricComponents: fabricItems,
          fabricRatio: '',
          qualityReportFileId,
          factoryName: '',
          responsibleEmployeeId: null,
          responsibleEmployeeName: '',
          status: 'planned',
          notes: '',
          createdBy: this.ctx.state.user.id,
        }, { transaction })
        await this.log('工单新增批次', 'batches', item, {
          orderId: order ? Number(order.id) : null,
          productId: Number(productId),
          batchNo: item.batchNo,
          quantity,
          qualityReportFileId,
        }, transaction)
        return Number(item.id)
      })
      return this.get('batches', id)
    } catch (error) {
      if (reportPath) await fsp.unlink(reportPath).catch(() => undefined)
      throw error
    }
  }

  async getBatchReportFile(id) {
    const batch = await this.app.model.ProductionBatch.findByPk(id)
    if (!batch?.qualityReportFileId) return null
    const item = await this.app.model.File.findOne({
      where: {
        id: batch.qualityReportFileId,
        category: 'production_batch_report',
      },
    })
    if (!item) return null
    const filePath = path.join(this.app.baseDir, 'storage', 'uploads', item.storedName)
    try {
      await fsp.access(filePath)
      return { item, filePath }
    } catch {
      return null
    }
  }

  async update(resource, id, value) {
    // 更新前重新执行关联校验，避免绕过创建阶段的数量和状态约束。
    const updated = await this.app.model.transaction(async (transaction) => {
      const item = await this.model(resource).findByPk(id, { transaction })
      if (!item) return null
      let payload = this.payload(resource, value)
      payload = await this.validateRelations(resource, payload, id, transaction)
      await item.update(payload, { transaction })
      await this.log(`编辑${resource}`, resource, item, payload, transaction)
      return true
    })
    return updated ? this.get(resource, id) : null
  }

  async destroy(resource, id) {
    if (resource !== 'orders') invalid('生产资源类型无效', 404)
    return this.app.model.transaction(async (transaction) => {
      const item = await this.app.model.ProductionOrder.findByPk(id, {
        transaction,
      })
      if (!item) return false
      const batchCount = await this.app.model.ProductionBatch.count({
        where: { orderId: id },
        transaction,
      })
      if (batchCount > 0) invalid('工单已有生产批次，不能删除')
      await this.log(
        '删除orders',
        resource,
        item,
        { orderNo: item.orderNo },
        transaction,
      )
      await item.destroy({ transaction })
      return true
    })
  }

  async createBatchStep(batchId, value, file = null) {
    const hasProcess =
      value.processId !== null &&
      value.processId !== undefined &&
      value.processId !== ''
    const processId = hasProcess
      ? positiveInteger(value.processId, '环节名称')
      : null
    const customContent = processId
      ? ''
      : required(value.content, '自定义环节名称', 200)
    const operatorName = required(value.operatorName, '操作人', 80)
    const startedAt = validDate(value.startedAt, '开始日期')
    const completedAt = value.completedAt
      ? validDate(value.completedAt, '完成日期')
      : null
    const status = String(value.status || '')

    if (!batchStepStatuses.has(status)) invalid('环节状态无效')
    if (completedAt && new Date(completedAt) < new Date(startedAt)) {
      invalid('完成日期不能早于开始日期')
    }

    const notes = String(value.notes || '')
      .trim()
      .slice(0, 500)
    const [batch, process] = await Promise.all([
      this.app.model.ProductionBatch.findByPk(batchId),
      processId
        ? this.app.model.ProductionProcess.findOne({
            where: { id: processId, status: 'enabled' },
          })
        : Promise.resolve(null),
    ])

    if (!batch) invalid('生产批次不存在', 404)
    if (processId && !process) invalid('所选生产环节不存在或已停用')

    const nodeName = process?.nodeName || customContent

    let targetPath = ''
    let fileStat = null
    let extension = ''

    if (file) {
      extension = batchStepPhotoExtensions[file.mime]
      if (!extension) invalid('现场照片仅支持 JPG、PNG、WEBP')

      fileStat = await fsp.stat(file.filepath)
      if (fileStat.size > 10 * 1024 * 1024) {
        invalid('现场照片不能超过 10MB')
      }

      const storedName = `${crypto.randomUUID()}${extension}`
      const uploadDir = path.join(this.app.baseDir, 'storage', 'uploads')
      targetPath = path.join(uploadDir, storedName)
      await fsp.mkdir(uploadDir, { recursive: true })
      await fsp.copyFile(file.filepath, targetPath)
    }

    try {
      const id = await this.app.model.transaction(async (transaction) => {
        let photoFileId = null

        if (file && fileStat) {
          const photo = await this.app.model.File.create(
            {
              originalName: file.filename,
              storedName: path.basename(targetPath),
              mimeType: file.mime,
              category: 'production_photo',
              size: fileStat.size,
              uploadedBy: this.ctx.state.user.id,
            },
            { transaction },
          )
          photoFileId = Number(photo.id)
        }

        const item = await this.app.model.ProductionRecord.create(
          {
            batchId: Number(batch.id),
            employeeId: this.ctx.state.user.id,
            processId: process ? Number(process.id) : null,
            content: nodeName,
            operatorName,
            photoFileId,
            quantity: Number(batch.quantity),
            startedAt,
            completedAt,
            status,
            notes,
            createdBy: this.ctx.state.user.id,
          },
          { transaction },
        )

        await this.log(
          '新增生产环节',
          'records',
          item,
          {
            batchId: Number(batch.id),
            processId: process ? Number(process.id) : null,
            content: nodeName,
            operatorName,
            startedAt,
            completedAt,
            status,
            photoFileId,
          },
          transaction,
        )

        return Number(item.id)
      })

      const item = await this.app.model.ProductionRecord.findByPk(id)
      return {
        id: Number(item.id),
        nodeName,
        nodeOrder: process
          ? Number(process.nodeOrder)
          : 100000 + Number(item.id),
        custom: !process,
        status: item.status,
        employeeName: item.operatorName,
        startedAt: this.ctx.helper.formatDateTime(item.startedAt),
        completedAt: this.ctx.helper.formatDateTime(item.completedAt),
        notes: item.notes || '',
        photoFileId: item.photoFileId ? Number(item.photoFileId) : null,
      }
    } catch (error) {
      if (targetPath) await fsp.unlink(targetPath).catch(() => undefined)
      throw error
    }
  }

  async deleteBatchStep(batchId, stepId) {
    let storedName = ''

    const deleted = await this.app.model.transaction(async (transaction) => {
      const item = await this.app.model.ProductionRecord.findOne({
        where: { id: stepId, batchId },
        transaction,
      })
      if (!item) return false

      const photo = item.photoFileId
        ? await this.app.model.File.findOne({
            where: {
              id: item.photoFileId,
              category: 'production_photo',
            },
            transaction,
          })
        : null

      await this.log(
        '删除生产环节',
        'records',
        item,
        {
          batchId: Number(item.batchId),
          content: item.content || '',
          processId: item.processId ? Number(item.processId) : null,
        },
        transaction,
      )
      await item.destroy({ transaction })

      if (photo) {
        storedName = photo.storedName
        await photo.destroy({ transaction })
      }

      return true
    })

    if (storedName) {
      await fsp
        .unlink(path.join(this.app.baseDir, 'storage', 'uploads', storedName))
        .catch(() => undefined)
    }

    return deleted
  }

  async updateStatus(resource, id, status) {
    if (!statuses[resource]?.has(status)) invalid('状态值无效')
    const item = await this.model(resource).findByPk(id)
    if (!item) return null
    const before = item.status
    await item.update({ status })
    await this.log(`更新${resource}状态`, resource, item, { before, status })
    return this.get(resource, id)
  }
}

module.exports = ProductionService
