'use strict'

const { Controller } = require('egg')

// 二维码前缀须便于印刷识别，并限制长度以给后续序号预留空间。
const prefixPattern = /^[A-Z][A-Z0-9_-]{1,11}$/

// 将单次和批量生成请求归一化为相同的数据结构。
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
 * 二维码概览、生成批次和生产批次绑定接口控制器。
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

  async overview() {
    // 服务层根据字段权限隐藏产品信息或二维码状态统计。
    const permissions = await this.ctx.service.auth.getPermissions(
      this.ctx.state.user.id,
    )
    this.ok(await this.ctx.service.qrcodes.overview(this.ctx.query, permissions))
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

  async batchGenerate() {
    // 限制导入行数，防止单次请求创建过多数据库任务。
    const rawItems = this.ctx.request.body?.items
    if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 100) {
      return this.fail('批量文件须包含 1 至 100 行有效数据')
    }
    const items = rawItems.map((item) => ({
      ...generationPayload(item),
      productCode: String(item.productCode || '').trim().toUpperCase(),
    }))
    for (let index = 0; index < items.length; index += 1) {
      if (!items[index].productCode) return this.fail(`第 ${index + 1} 行缺少产品编号`)
      const error = generationError({ ...items[index], productId: 1 })
      if (error) return this.fail(`第 ${index + 1} 行：${error}`)
    }

    // 行数之外再限制二维码总量，避免少数大数量行绕过批量上限。
    const total = items.reduce((sum, item) => sum + item.quantity, 0)
    if (total > 200000) return this.fail('单次批量生成总量不能超过 200000')
    return this.run(async () => {
      this.ok(
        await this.ctx.service.qrcodes.batchGenerate(items),
        `已创建 ${items.length} 个二维码批次`,
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
