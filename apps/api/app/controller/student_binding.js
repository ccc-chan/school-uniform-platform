'use strict'

const { Controller } = require('egg')

class StudentBindingController extends Controller {
  async run(action) {
    this.ctx.set('Cache-Control', 'no-store')
    try {
      const code = String(this.ctx.params.code || '').trim()
      if (!code || code.length > 40) this.ctx.throw(400, '二维码编号无效')
      this.ctx.body = { code: 200, message: 'success', data: await action(code) }
    } catch (error) {
      if (![400, 404, 409].includes(error.status)) throw error
      this.ctx.status = error.status
      this.ctx.body = { code: error.status, message: error.message, data: null }
    }
  }

  async show() {
    return this.run((code) => this.ctx.service.studentBinding.show(code))
  }

  async create() {
    return this.run((code) => {
      const body = this.ctx.request.body || {}
      if (body.parentAuthorized !== true) this.ctx.throw(400, '请确认信息真实并同意绑定')
      const value = {}
      for (const [key, label, required, max] of [
        ['studentName', '学生姓名', true, 100],
        ['studentNo', '学生编号', true, 100],
        ['grade', '年级', false, 100],
        ['className', '班级', false, 100],
        ['parentName', '家长姓名', true, 100],
        ['parentRelation', '家长关系', true, 50],
        ['phone', '家长手机号', true, 11],
      ]) {
        const input = body[key] ?? ''
        if (typeof input !== 'string' || input.trim().length > max) {
          this.ctx.throw(400, `${label}格式或长度无效`)
        }
        value[key] = input.trim()
        if (required && !value[key]) this.ctx.throw(400, `请填写${label}`)
      }
      if (!['爸爸', '妈妈', '其他监护人'].includes(value.parentRelation)) {
        this.ctx.throw(400, '请选择家长关系')
      }
      if (!/^1[3-9]\d{9}$/.test(value.phone)) this.ctx.throw(400, '请输入有效的11位手机号')
      return this.ctx.service.studentBinding.create(code, value)
    })
  }
}

module.exports = StudentBindingController
