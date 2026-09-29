'use strict'

const { Controller } = require('egg')

class SchoolsController extends Controller {
  async index() {
    const keyword = String(this.ctx.query.keyword || '').trim().slice(0, 100)
    const schoolType = String(this.ctx.query.schoolType || '').trim().slice(0, 50)
    this.ctx.body = {
      code: 200,
      message: 'success',
      data: await this.ctx.service.schools.list({
        keyword,
        schoolType,
        page: this.ctx.query.page,
        pageSize: this.ctx.query.pageSize,
      }),
    }
  }
}

module.exports = SchoolsController
