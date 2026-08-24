'use strict'
const { Controller } = require('egg')

// 控制器使用固定集合校验枚举值，避免任意分类、季节或尺码写入数据库。
const categories = new Set([
  'sports_set',
  'formal_set',
  'outerwear',
  'single_item',
  'accessory',
])

const seasons = new Set(['spring', 'summer', 'autumn', 'winter', 'all_season'])
const qrCodeTypes = new Set(['product', 'batch', 'school'])
const productSizes = new Set([
  'xs',
  's',
  'm',
  'l',
  'xl',
  'xxl',
  '120',
  '130',
  '140',
  '150',
  '160',
  '170',
])

// 将多选字段统一转换为去除空白后的字符串数组。
const array = (value) =>
  Array.isArray(value)
    ? value.map(String).map((v) => v.trim()).filter(Boolean)
    : []

// 同时兼容 multipart 的 payload 字段与普通 JSON 请求体。
function payload(ctx) {
  let value = ctx.request.body || {}
  if (value.payload) {
    try { value = JSON.parse(value.payload) } catch { value = {} }
  }

  return {
    name: String(value.name || '').trim(),
    code: String(value.code || '').trim().toUpperCase(),
    category: String(value.category || ''),
    qrCodeType: String(value.qrCodeType || ''),
    applicableSchools: array(value.applicableSchools),
    season: String(value.season || ''),
    style: String(value.style || '').trim(),
    color: String(value.color || '').trim(),
    sizes: array(value.sizes).map((size) => size.toLowerCase()),
    fabricInfo: String(value.fabricInfo || '').trim(),
    executionStandard: String(value.executionStandard || '').trim(),
    washingInstructions: String(value.washingInstructions || '').trim(),
  }
}

// 集中校验必填项、产品编号格式、枚举范围以及图片要求。
function invalid(value, hasImage) {
  if (
    !value.name ||
    !value.code ||
    !value.category ||
    !value.qrCodeType
  ) {
    return '请完整填写产品必填信息'
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(value.code)) {
    return '产品编号格式不正确'
  }
  if (
    !categories.has(value.category) ||
    (value.season && !seasons.has(value.season)) ||
    !qrCodeTypes.has(value.qrCodeType)
  ) {
    return '产品分类、二维码类型或季节无效'
  }
  if (value.sizes.some((size) => !productSizes.has(size))) {
    return '产品尺码无效'
  }
  if (!hasImage) return '请上传产品图片'
  return ''
}

/**
 * 产品档案、产品图片和产品状态接口控制器。
 */
class ProductsController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  async index() {
    const permissions = await this.ctx.service.auth.getPermissions(
      this.ctx.state.user.id,
    )
    this.ok(
      await this.ctx.service.products.list(this.ctx.query, permissions),
    )
  }

  async show() {
    const item = await this.ctx.service.products.get(
      Number(this.ctx.params.id),
    )
    return item ? this.ok(item) : this.fail('产品不存在', 404)
  }

  async detail() {
    const permissions = await this.ctx.service.auth.getPermissions(
      this.ctx.state.user.id,
    )
    const item = await this.ctx.service.products.detail(
      Number(this.ctx.params.id),
      permissions,
    )
    return item ? this.ok(item) : this.fail('产品不存在', 404)
  }

  async image() {
    const result = await this.ctx.service.products.getImage(
      Number(this.ctx.params.id),
    )
    if (!result) return this.fail('图片不存在', 404)
    this.ctx.type = result.item.mimeType
    this.ctx.body = result.stream
  }
  async create() {
    const value = payload(this.ctx)
    const file = this.ctx.request.files?.[0]
    const error = invalid(value, Boolean(file))

    if (error) {
      await this.ctx.cleanupRequestFiles()
      return this.fail(error)
    }

    try {
      this.ok(
        await this.ctx.service.products.create(value, file),
        '产品创建成功',
      )
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return this.fail('产品编号已存在')
      }
      throw e
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async update() {
    const value = payload(this.ctx)
    const current = await this.ctx.service.products.get(
      Number(this.ctx.params.id),
    )
    const file = this.ctx.request.files?.[0]
    const error = invalid(value, Boolean(file || current?.imageId))

    if (error) {
      await this.ctx.cleanupRequestFiles()
      return this.fail(error)
    }

    try {
      const item = await this.ctx.service.products.update(
        Number(this.ctx.params.id),
        value,
        file,
      )
      return item ? this.ok(item, '产品更新成功') : this.fail('产品不存在', 404)
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async updateStatus() {
    const status = String(this.ctx.request.body.status || '')
    if (!['enabled', 'disabled'].includes(status)) {
      return this.fail('产品状态无效')
    }
    const item = await this.ctx.service.products.updateStatus(
      Number(this.ctx.params.id),
      status,
    )
    return item
      ? this.ok(item, '产品状态更新成功')
      : this.fail('产品不存在', 404)
  }

  async destroy() {
    return (await this.ctx.service.products.destroy(
      Number(this.ctx.params.id),
    ))
      ? this.ok(null, '产品删除成功')
      : this.fail('产品不存在', 404)
  }
}

module.exports = ProductsController
