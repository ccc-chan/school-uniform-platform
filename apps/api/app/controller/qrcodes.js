'use strict'

const { Controller } = require('egg')

// 二维码前缀须便于印刷识别，并限制长度以给后续序号预留空间。
const prefixPattern = /^[A-Z][A-Z0-9_-]{1,11}$/

// 规范化二维码生成请求。
function generationPayload(value = {}) {
  return {
    productId: Number(value.productId),
    quantity: Number(value.quantity),
    prefix: String(value.prefix || '').trim().toUpperCase(),
    notes: String(value.notes || '').trim().slice(0, 500),
  }
}

// 统一校验生成数量、产品 ID 和编号前缀。
function generationError(value) {
  if (!Number.isInteger(value.productId) || value.productId < 1) return '请选择产品'
  if (!Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 100000) {
    return '生成数量须为 1 至 100000 的整数'
  }
  if (!prefixPattern.test(value.prefix)) {
    return '编号前缀须以字母开头，由 2 至 12 位大写字母、数字、下划线或短横线组成'
  }
  return ''
}

/**
 * 二维码生成、标签打印和生产批次绑定接口控制器。
 */
class QrcodesController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  async run(action) {
    // 服务层标记为 400 的可预期业务异常直接返回给客户端。
    try {
      return await action()
    } catch (error) {
      if (error.status === 400) return this.fail(error.message)
      throw error
    }
  }

  async products() {
    this.ok(await this.ctx.service.qrcodes.products())
  }

  async batches() {
    this.ok(await this.ctx.service.qrcodes.batches())
  }

  async labelPrintBatches() {
    this.ok(await this.ctx.service.qrcodes.labelPrintBatches())
  }

  async labelPrintBatch() {
    const batchNo = String(this.ctx.params.batchNo || '').trim()
    if (!batchNo || batchNo.length > 100) {
      return this.fail('生产批次无效')
    }

    const result = await this.ctx.service.qrcodes.labelPrintBatch(
      batchNo,
      this.ctx.query,
    )
    if (!result) return this.fail('生产批次不存在或没有可打印标签', 404)

    this.ok(result)
  }

  async generate() {
    const value = generationPayload(this.ctx.request.body)
    const error = generationError(value)
    if (error) return this.fail(error)
    return this.run(async () => {
      this.ok(await this.ctx.service.qrcodes.generate(value), '二维码生成成功')
    })
  }

  async generateProductionBatch() {
    const batchId = Number(this.ctx.params.id)
    if (!Number.isInteger(batchId) || batchId < 1) {
      return this.fail('生产批次无效')
    }

    return this.run(async () => {
      this.ok(
        await this.ctx.service.qrcodes.generateProductionBatch(batchId),
        '当前生产批次二维码生成成功',
      )
    })
  }

  async bind() {
    // 绑定请求将一个生成批次中的未绑定二维码关联到实际生产批次。
    const value = {
      generationBatchId: Number(this.ctx.request.body?.generationBatchId),
      quantity: Number(this.ctx.request.body?.quantity),
      productSku: String(this.ctx.request.body?.productSku || '').trim(),
      productionBatch: String(this.ctx.request.body?.productionBatch || '').trim(),
    }
    if (!Number.isInteger(value.generationBatchId) || value.generationBatchId < 1) {
      return this.fail('请选择二维码生成批次')
    }
    if (!Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 100000) {
      return this.fail('绑定数量须为 1 至 100000 的整数')
    }
    if (!value.productSku || value.productSku.length > 100) return this.fail('请填写有效的产品 SKU')
    if (!value.productionBatch || value.productionBatch.length > 100) {
      return this.fail('请填写有效的生产批次')
    }
    return this.run(async () => {
      this.ok(await this.ctx.service.qrcodes.bind(value), '二维码绑定成功')
    })
  }
}

module.exports = QrcodesController
