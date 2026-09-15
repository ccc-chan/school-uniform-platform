'use strict'

const { Controller } = require('egg')

function text(value, max, label) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.trim().length > max) {
    throw Object.assign(new Error(`${label}格式或长度无效`), { status: 400 })
  }
  return value.trim()
}

class QrManagementController extends Controller {
  async run(action) {
    this.ctx.set('Cache-Control', 'no-store')
    try {
      this.ctx.body = { code: 200, message: 'success', data: await action() }
    } catch (error) {
      if (![400, 403, 404, 409].includes(error.status)) throw error
      this.ctx.status = error.status
      this.ctx.body = { code: error.status, message: error.message, data: null }
    }
  }

  id() {
    const id = Number(this.ctx.params.id)
    if (!Number.isSafeInteger(id) || id < 1) this.ctx.throw(400, '二维码ID无效')
    return id
  }

  async list() {
    return this.run(() => {
      const body = this.ctx.request.body || {}
      const query = { page: body.page, pageSize: body.pageSize }
      for (const key of ['code', 'studentName', 'schoolName', 'phone', 'status']) {
        query[key] = text(body[key], key === 'phone' ? 11 : 100, key)
      }
      if (query.phone && !/^\d+$/.test(query.phone)) this.ctx.throw(400, '手机号查询请输入数字片段')
      if (query.status && !['unbound', 'bound', 'activated', 'voided', 'disabled'].includes(query.status)) this.ctx.throw(400, '状态无效')
      return this.ctx.service.qrManagement.list(query)
    })
  }

  async save() {
    return this.run(() => {
      const body = this.ctx.request.body || {}
      const value = { version: Number(body.version) }
      for (const key of ['schoolName', 'className', 'studentName', 'parentName']) {
        value[key] = text(body[key], 100, key)
        if (!value[key]) this.ctx.throw(400, '学校、班级、学生姓名和家长姓名不能为空')
      }
      value.phone = text(body.phone, 11, '手机号')
      value.studentGender = text(body.studentGender, 10, '性别')
      if (!['', 'male', 'female', 'unknown'].includes(value.studentGender)) this.ctx.throw(400, '性别无效')
      value.grade = text(body.grade, 100, '年级')
      value.studentNo = text(body.studentNo, 100, '学号')
      value.parentRelation = text(body.parentRelation, 50, '家长关系')
      if (value.phone && !/^1[3-9]\d{9}$/.test(value.phone)) this.ctx.throw(400, '请输入有效的11位手机号')
      if (!Number.isSafeInteger(value.version) || value.version < 0) this.ctx.throw(400, '绑定版本无效')
      return this.ctx.service.qrManagement.save(this.id(), value)
    })
  }

  async scans() {
    return this.run(() => this.ctx.service.qrManagement.scans(this.id(), this.ctx.query))
  }

  async detail() {
    return this.run(() => this.ctx.service.qrManagement.detail(this.id()))
  }

  async availability() {
    return this.run(() => {
      const body = this.ctx.request.body || {}
      if (typeof body.disabled !== 'boolean' || typeof body.expectedDisabled !== 'boolean') {
        this.ctx.throw(400, '停用状态参数无效')
      }
      return this.ctx.service.qrManagement.setDisabled(this.id(), body)
    })
  }
}

module.exports = QrManagementController
