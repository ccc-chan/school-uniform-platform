'use strict'

const { Controller } = require('egg')

function payload(ctx) {
  let value = ctx.request.body || {}
  if (value.payload) try { value = JSON.parse(value.payload) } catch { value = {} }
  const text = (key, max) => String(value[key] || '').trim().slice(0, max)
  return {
    name: text('name', 160), englishName: text('englishName', 200), creditCode: text('creditCode', 32).toUpperCase(),
    legalRepresentative: text('legalRepresentative', 100), industry: text('industry', 120),
    region: text('region', 160), address: text('address', 255), contactPhone: text('contactPhone', 30),
  }
}

class CompaniesController extends Controller {
  ok(data, message = 'success') { this.ctx.body = { code: 200, message, data } }
  fail(message, status = 400) { this.ctx.status = status; this.ctx.body = { code: status, message, data: null } }
  valid(value) {
    if (!value.name || !value.creditCode || !value.legalRepresentative || !value.address || !value.contactPhone) return '请完整填写公司必填信息'
    if (!/^[0-9A-Z]{18}$/.test(value.creditCode)) return '统一社会信用代码应为18位数字或大写字母'
    return ''
  }
  async index() { this.ok(await this.ctx.service.companies.list(this.ctx.query)) }
  async options() { this.ok(await this.ctx.service.companies.options()) }
  async create() {
    const value = payload(this.ctx), error = this.valid(value), file = this.ctx.request.files?.[0]
    if (error) { await this.ctx.cleanupRequestFiles(); return this.fail(error) }
    try { this.ok(await this.ctx.service.companies.create(value, file), '公司创建成功') }
    catch (e) { if (e.name === 'SequelizeUniqueConstraintError') return this.fail('统一社会信用代码已存在'); if (e.status === 400) return this.fail(e.message); throw e }
    finally { await this.ctx.cleanupRequestFiles() }
  }
  async update() {
    const value = payload(this.ctx), error = this.valid(value), file = this.ctx.request.files?.[0]
    if (error) { await this.ctx.cleanupRequestFiles(); return this.fail(error) }
    try { const item = await this.ctx.service.companies.update(Number(this.ctx.params.id), value, file); return item ? this.ok(item, '公司更新成功') : this.fail('公司不存在', 404) }
    catch (e) { if (e.name === 'SequelizeUniqueConstraintError') return this.fail('统一社会信用代码已存在'); if (e.status === 400) return this.fail(e.message); throw e }
    finally { await this.ctx.cleanupRequestFiles() }
  }
  async status() {
    const status = String(this.ctx.request.body.status || '')
    if (!['enabled', 'disabled'].includes(status)) return this.fail('公司状态无效')
    const item = await this.ctx.service.companies.setStatus(Number(this.ctx.params.id), status)
    return item ? this.ok(item, '公司状态更新成功') : this.fail('公司不存在', 404)
  }
  async destroy() {
    const result = await this.ctx.service.companies.destroy(Number(this.ctx.params.id))
    if (!result) return this.fail('公司不存在', 404)
    if (result.conflict) return this.fail('该公司仍有绑定产品，不能删除', 409)
    return this.ok(null, '公司删除成功')
  }
  async license() {
    const result = await this.ctx.service.companies.license(Number(this.ctx.params.id))
    if (!result) return this.fail('营业执照不存在', 404)
    this.ctx.type = result.item.mimeType; this.ctx.body = result.stream
  }
}

module.exports = CompaniesController
