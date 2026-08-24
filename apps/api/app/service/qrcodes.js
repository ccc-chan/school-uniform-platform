'use strict'

const { randomBytes } = require('node:crypto')
const { Op, QueryTypes } = require('sequelize')
const { Service } = require('egg')

// 大批量二维码按固定大小分块写入，控制单次 SQL 的参数和内存规模。
const BATCH_CHUNK_SIZE = 1000
const CHINA_OFFSET = 8 * 60 * 60 * 1000

function chinaIsoString() {
  return new Date(Date.now() + CHINA_OFFSET).toISOString()
}

function userError(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function sqlFilters(query, replacements) {
  const clauses = []
  const keyword = String(query.keyword || '').trim()
  const status = String(query.status || '')
  if (keyword) {
    clauses.push('(p.code LIKE :keyword OR p.name LIKE :keyword)')
    replacements.keyword = `%${keyword}%`
  }
  if (['unbound', 'bound', 'activated', 'voided'].includes(status)) {
    clauses.push('q.status = :status')
    replacements.status = status
  }
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
}

/**
 * 管理二维码生成批次、批量写入、统计和生产批次绑定。
 */
class QrcodesService extends Service {
  async log(action, targetType, targetId, context, transaction) {
    const row = await this.app.model.OperationLog.create(
      {
        employeeId: this.ctx.state.user.id,
        module: '二维码中心',
        action,
        targetType,
        targetId,
        detail: {
          request: {
            method: this.ctx.method,
            path: this.ctx.path,
          },
          response: null,
          context,
        },
        ip: this.ctx.ip,
      },
      { transaction },
    )
    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(row.id))
  }

  async overview(query, permissions) {
    // 产品和状态相关统计由服务端依据字段权限决定是否返回。
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const replacements = {
      limit: pageSize,
      offset,
    }
    const where = sqlFilters(query, replacements)
    const [metricRows, rows, countRows] = await Promise.all([
      this.app.model.query(
        `SELECT
          COUNT(*) AS total,
          SUM(status = 'bound') AS bound,
          SUM(status = 'unbound') AS unbound,
          SUM(status = 'activated') AS activated,
          SUM(status = 'voided') AS voided
        FROM qr_codes`,
        { type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT
          p.id AS productId,
          p.code AS productCode,
          p.name AS productName,
          p.style,
          p.color,
          COUNT(q.id) AS total,
          SUM(q.status = 'bound') AS bound,
          SUM(q.status = 'unbound') AS unbound,
          SUM(q.status = 'activated') AS activated,
          SUM(q.status = 'voided') AS voided
        FROM qr_codes q
        JOIN qr_generation_batches b
          ON b.id = q.generation_batch_id
        JOIN prd_products p ON p.id = b.product_id
        ${where}
        GROUP BY p.id, p.code, p.name, p.style, p.color
        ORDER BY p.id DESC
        LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT COUNT(*) AS total FROM (
          SELECT p.id
          FROM qr_codes q
          JOIN qr_generation_batches b
            ON b.id = q.generation_batch_id
          JOIN prd_products p ON p.id = b.product_id
          ${where}
          GROUP BY p.id
        ) grouped_products`,
        { replacements, type: QueryTypes.SELECT },
      ),
    ])
    const metrics = metricRows[0]
    const countRow = countRows[0]
    const canSeeProduct = permissions.includes('qrcode.field.product')
    const canSeeStatus = permissions.includes('qrcode.field.status')
    const items = rows.map((item) => ({
      productId: Number(item.productId),
      ...(canSeeProduct
        ? {
            productCode: item.productCode,
            productName: item.productName,
            style: item.style,
            color: item.color,
          }
        : {}),
      total: Number(item.total || 0),
      ...(canSeeStatus
        ? {
            bound: Number(item.bound || 0),
            unbound: Number(item.unbound || 0),
            activated: Number(item.activated || 0),
            voided: Number(item.voided || 0),
          }
        : {}),
    }))
    return {
      metrics: {
        total: Number(metrics?.total || 0),
        bound: Number(metrics?.bound || 0),
        unbound: Number(metrics?.unbound || 0),
        activated: Number(metrics?.activated || 0),
        voided: Number(metrics?.voided || 0),
      },
      items,
      total: Number(countRow?.total || 0),
      page,
      pageSize,
    }
  }

  async products() {
    const rows = await this.app.model.Product.findAll({
      where: { status: 'enabled' },
      attributes: ['id', 'code', 'name', 'style', 'color', 'season'],
      order: [['id', 'DESC']],
    })
    return rows.map((item) => ({
      id: Number(item.id),
      code: item.code,
      name: item.name,
      style: item.style,
      color: item.color,
      season: item.season,
    }))
  }

  batchNumber(mode) {
    const stamp = chinaIsoString().replace(/\D/g, '').slice(0, 14)
    return `${mode === 'batch' ? 'QB' : 'QG'}${stamp}${randomBytes(3).toString('hex').toUpperCase()}`
  }

  async createGenerationBatch(value, mode, transaction) {
    // 生成批次和二维码明细共用外部事务，任一分块失败会整体回滚。
    const product = await this.app.model.Product.findOne({
      where: { id: value.productId, status: 'enabled' },
      transaction,
    })
    if (!product) throw userError('所选产品不存在或已停用')
    const batch = await this.app.model.QrGenerationBatch.create(
      {
        batchNo: this.batchNumber(mode),
        mode,
        productId: product.id,
        quantity: value.quantity,
        prefix: value.prefix,
        notes: value.notes || '',
        createdBy: this.ctx.state.user.id,
      },
      { transaction },
    )
    const date = chinaIsoString().slice(0, 10).replaceAll('-', '')
    const batchPart = String(batch.id).padStart(8, '0')
    // 分块构造并批量插入二维码，编号包含日期、批次 ID 和批次内序号。
    for (let start = 1; start <= value.quantity; start += BATCH_CHUNK_SIZE) {
      const end = Math.min(value.quantity, start + BATCH_CHUNK_SIZE - 1)
      const codes = []
      for (let index = start; index <= end; index += 1) {
        codes.push({
          generationBatchId: batch.id,
          code: `${value.prefix}${date}${batchPart}${String(index).padStart(6, '0')}`,
          status: 'unbound',
          createdBy: this.ctx.state.user.id,
        })
      }
      await this.app.model.QrCode.bulkCreate(codes, { transaction })
    }
    return { batch, product }
  }

  async generate(value) {
    return this.app.model.transaction(async (transaction) => {
      const { batch, product } = await this.createGenerationBatch(
        value,
        'single',
        transaction,
      )
      await this.log(
        '生成二维码',
        'qr_generation_batch',
        batch.id,
        {
          batchNo: batch.batchNo,
          productCode: product.code,
          quantity: value.quantity,
          prefix: value.prefix,
        },
        transaction,
      )
      return {
        id: Number(batch.id),
        batchNo: batch.batchNo,
        productName: product.name,
        quantity: value.quantity,
      }
    })
  }

  async batchGenerate(items) {
    // 整个导入文件使用一个事务，避免只生成部分产品批次。
    return this.app.model.transaction(async (transaction) => {
      const productCodes = [...new Set(items.map((item) => item.productCode))]
      const products = await this.app.model.Product.findAll({
        where: { code: productCodes, status: 'enabled' },
        transaction,
      })
      const productMap = new Map(products.map((item) => [item.code, item]))
      const missing = productCodes.filter((code) => !productMap.has(code))
      if (missing.length) throw userError(`产品编号不存在或已停用：${missing.join('、')}`)

      const results = []
      for (const item of items) {
        const product = productMap.get(item.productCode)
        const { batch } = await this.createGenerationBatch(
          { ...item, productId: Number(product.id) },
          'batch',
          transaction,
        )
        results.push({
          id: Number(batch.id),
          batchNo: batch.batchNo,
          productCode: product.code,
          productName: product.name,
          quantity: item.quantity,
        })
      }
      await this.log(
        '批量生成二维码',
        'qr_generation_batch',
        results[0].id,
        {
          batchCount: results.length,
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
          batchNos: results.map((item) => item.batchNo),
        },
        transaction,
      )
      return results
    })
  }

  async batches() {
    // 只返回仍有未绑定二维码的生成批次，并计算实时可用数量。
    const rows = await this.app.model.query(
      `SELECT
        b.id,
        b.batch_no AS batchNo,
        b.quantity,
        b.prefix,
        b.created_at AS createdAt,
        p.id AS productId,
        p.code AS productCode,
        p.name AS productName,
        p.style,
        SUM(q.status = 'unbound') AS available
      FROM qr_generation_batches b
      JOIN prd_products p ON p.id = b.product_id
      JOIN qr_codes q ON q.generation_batch_id = b.id
      GROUP BY b.id, b.batch_no, b.quantity, b.prefix, b.created_at,
        p.id, p.code, p.name, p.style
      HAVING available > 0
      ORDER BY b.id DESC`,
      { type: QueryTypes.SELECT },
    )
    return rows.map((item) => ({
      id: Number(item.id),
      batchNo: item.batchNo,
      quantity: Number(item.quantity),
      available: Number(item.available),
      prefix: item.prefix,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
      productId: Number(item.productId),
      productCode: item.productCode,
      productName: item.productName,
      style: item.style,
    }))
  }

  async labelPrintBatches() {
    // 标签打印只展示已有绑定关系的生产批次，避免打印无法追溯的空白身份标签。
    const rows = await this.app.model.query(
      `SELECT
        q.production_batch AS batchNo,
        pb.production_date AS productionDate,
        p.code AS productCode,
        p.name AS productName,
        p.style,
        p.fabric_info AS fabricInfo,
        COUNT(q.id) AS labelCount
      FROM qr_codes q
      JOIN prd_products p ON p.id = q.product_id
      LEFT JOIN production_batches pb
        ON pb.batch_no = q.production_batch
        AND pb.product_id = q.product_id
      WHERE q.status IN ('bound', 'activated')
        AND q.production_batch IS NOT NULL
        AND q.production_batch <> ''
      GROUP BY
        q.production_batch, pb.production_date,
        p.code, p.name, p.style, p.fabric_info
      ORDER BY MAX(q.id) DESC`,
      { type: QueryTypes.SELECT },
    )

    return rows.map((item) => ({
      batchNo: item.batchNo,
      productionDate: item.productionDate,
      productCode: item.productCode,
      productName: item.productName,
      style: item.style || '',
      fabricInfo: item.fabricInfo || '',
      labelCount: Number(item.labelCount || 0),
    }))
  }

  async labelPrintBatch(batchNo, query) {
    // 分页返回二维码明细；前端预览仅取首条，真正打印时再按页加载全部标签。
    const { page, pageSize, offset } = this.ctx.helper.pagination(query, {
      defaultPageSize: 100,
      maxPageSize: 500,
    })
    const keyword = String(query.keyword || '').trim().slice(0, 100)
    const codeFilter = keyword ? 'AND q.code LIKE :keyword' : ''
    const filterReplacements = {
      batchNo,
      ...(keyword ? { keyword: `%${keyword}%` } : {}),
    }
    const [batchRows, items, countRows] = await Promise.all([
      this.app.model.query(
        `SELECT
          q.production_batch AS batchNo,
          pb.production_date AS productionDate,
          p.code AS productCode,
          p.name AS productName,
          p.style,
          p.fabric_info AS fabricInfo
        FROM qr_codes q
        JOIN prd_products p ON p.id = q.product_id
        LEFT JOIN production_batches pb
          ON pb.batch_no = q.production_batch
          AND pb.product_id = q.product_id
        WHERE q.production_batch = :batchNo
          AND q.status IN ('bound', 'activated')
        ORDER BY q.id ASC
        LIMIT 1`,
        { replacements: { batchNo }, type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT
          q.id,
          q.code,
          q.product_sku AS productSku
        FROM qr_codes q
        WHERE q.production_batch = :batchNo
          AND q.status IN ('bound', 'activated')
          ${codeFilter}
        ORDER BY q.id ASC
        LIMIT :limit OFFSET :offset`,
        {
          replacements: { ...filterReplacements, limit: pageSize, offset },
          type: QueryTypes.SELECT,
        },
      ),
      this.app.model.query(
        `SELECT COUNT(q.id) AS total
        FROM qr_codes q
        WHERE q.production_batch = :batchNo
          AND q.status IN ('bound', 'activated')
          ${codeFilter}`,
        { replacements: filterReplacements, type: QueryTypes.SELECT },
      ),
    ])

    const batch = batchRows[0]
    const total = Number(countRows[0]?.total || 0)
    if (!batch) return null

    return {
      batch: {
        batchNo: batch.batchNo,
        productionDate: batch.productionDate,
        productCode: batch.productCode,
        productName: batch.productName,
        style: batch.style || '',
        fabricInfo: batch.fabricInfo || '',
        labelCount: total,
      },
      items: items.map((item) => {
        const skuParts = String(item.productSku || '').split('-').filter(Boolean)
        return {
          id: Number(item.id),
          code: item.code,
          productSku: item.productSku || '',
          size: skuParts.at(-1) || '',
        }
      }),
      total,
      page,
      pageSize,
    }
  }

  async bind(value) {
    // 对生成批次、生产批次和待绑定二维码加更新锁，防止并发重复绑定。
    return this.app.model.transaction(async (transaction) => {
      const batch = await this.app.model.QrGenerationBatch.findByPk(
        value.generationBatchId,
        { transaction, lock: transaction.LOCK.UPDATE },
      )
      if (!batch) throw userError('二维码生成批次不存在')
      const productionBatch = await this.app.model.ProductionBatch.findOne({
        where: {
          batchNo: value.productionBatch,
          productId: batch.productId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!productionBatch) {
        throw userError('生产批次不存在，或该批次与二维码产品不一致')
      }
      const codes = await this.app.model.QrCode.findAll({
        where: {
          generationBatchId: batch.id,
          status: 'unbound',
        },
        attributes: ['id'],
        order: [['id', 'ASC']],
        limit: value.quantity,
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (codes.length < value.quantity) {
        throw userError(`当前批次仅剩 ${codes.length} 个未绑定二维码`)
      }
      const ids = codes.map((item) => item.id)
      const boundAt = new Date()
      await this.app.model.QrCode.update(
        {
          status: 'bound',
          productId: batch.productId,
          productSku: value.productSku,
          productionBatch: value.productionBatch,
          boundBy: this.ctx.state.user.id,
          boundAt,
        },
        { where: { id: { [Op.in]: ids } }, transaction },
      )
      await this.log(
        '绑定二维码',
        'qr_generation_batch',
        batch.id,
        {
          batchNo: batch.batchNo,
          productionBatch: value.productionBatch,
          productSku: value.productSku,
          quantity: value.quantity,
        },
        transaction,
      )
      return {
        batchNo: batch.batchNo,
        quantity: value.quantity,
        productionBatch: value.productionBatch,
        productSku: value.productSku,
        boundAt: this.ctx.helper.formatDateTime(boundAt),
      }
    })
  }
}

module.exports = QrcodesService
