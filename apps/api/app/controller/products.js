'use strict'
const { Controller } = require('egg')

// 控制器使用固定集合校验枚举值，避免任意分类、季节或尺码写入数据库。
const categories = new Set([
  'short_sleeve_top',
  'long_sleeve_top',
  'shorts',
  'trousers',
  'outerwear',
  'set',
  'skirt',
  'shirt',
  'formalwear',
  'tshirt',
  'accessory',
])

const seasons = new Set(['spring', 'summer', 'autumn', 'winter', 'all_season'])
const schoolStages = new Set([
  'universal',
  'primary',
  'junior_high',
  'senior_high',
  'secondary_vocational',
  'higher_vocational',
  'kindergarten',
])
const genders = new Set(['unisex', 'male', 'female'])

const ids = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map(Number))].filter(
        (id) => Number.isSafeInteger(id) && id > 0,
      )
    : []

// 同时兼容 multipart 的 payload 字段与普通 JSON 请求体。
function payload(ctx) {
  let value = ctx.request.body || {}
  if (value.payload) {
    try {
      value = JSON.parse(value.payload)
    } catch {
      value = {}
    }
  }

  return {
    name: String(value.name || '').trim(),
    code: String(value.code || '')
      .trim()
      .toUpperCase(),
    category: String(value.category || ''),
    schoolStage: String(value.schoolStage || ''),
    gender: String(value.gender || ''),
    season: String(value.season || ''),
    retainedImageIds: ids(value.retainedImageIds),
  }
}

// 集中校验必填项、产品编号格式、枚举范围以及图片要求。
function invalid(value, imageCount) {
  if (
    !value.name ||
    !value.code ||
    !value.category ||
    !value.schoolStage ||
    !value.gender ||
    !value.season
  ) {
    return '请完整填写产品必填信息'
  }
  if ([...value.name].length > 10) {
    return '产品名称不能超过 10 个字'
  }
  if (!/^[A-Z0-9]{1,5}$/.test(value.code)) {
    return '产品编码只能包含大写字母和数字，且不超过 5 位'
  }
  if (
    !categories.has(value.category) ||
    !schoolStages.has(value.schoolStage) ||
    !genders.has(value.gender) ||
    !seasons.has(value.season)
  ) {
    return '产品类型、学段年级、性别或季节无效'
  }
  if (imageCount < 1) return '请上传产品图片'
  if (imageCount > 5) return '产品图片最多上传 5 张'
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
    this.ok(await this.ctx.service.products.list(this.ctx.query, permissions))
  }

  async codeAvailability() {
    const code = String(this.ctx.query.code || '').trim().toUpperCase()
    const excludeId = Number(this.ctx.query.excludeId) || null
    if (!/^[A-Z0-9]{1,5}$/.test(code)) {
      return this.fail('产品编码格式不正确')
    }
    this.ok({
      exists: await this.ctx.service.products.codeExists(code, excludeId),
    })
  }

  async show() {
    const item = await this.ctx.service.products.get(Number(this.ctx.params.id))
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
    const files = this.ctx.request.files || []
    const error = invalid(value, files.length)

    if (error) {
      await this.ctx.cleanupRequestFiles()
      return this.fail(error)
    }

    try {
      this.ok(
        await this.ctx.service.products.create(value, files),
        '产品创建成功',
      )
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return this.fail('产品编号已存在')
      }
      if (e.status === 400) return this.fail(e.message)
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
    const files = this.ctx.request.files || []
    const currentImageIds =
      current?.imageIds || (current?.imageId ? [current.imageId] : [])
    const retainedImageIds = value.retainedImageIds.filter((id) =>
      currentImageIds.includes(id),
    )
    const error = invalid(value, retainedImageIds.length + files.length)

    if (error) {
      await this.ctx.cleanupRequestFiles()
      return this.fail(error)
    }

    try {
      const item = await this.ctx.service.products.update(
        Number(this.ctx.params.id),
        { ...value, retainedImageIds },
        files,
      )
      return item ? this.ok(item, '产品更新成功') : this.fail('产品不存在', 404)
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return this.fail('产品编码已存在')
      }
      if (e.status === 400) return this.fail(e.message)
      throw e
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
    return (await this.ctx.service.products.destroy(Number(this.ctx.params.id)))
      ? this.ok(null, '产品删除成功')
      : this.fail('产品不存在', 404)
  }
}

module.exports = ProductsController
