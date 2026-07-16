'use strict'

const { Controller } = require('egg')

class HealthController extends Controller {
  async index() {
    this.ctx.body = {
      code: 200,
      message: 'success',
      data: {
        service: 'school-uniform-api',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    }
  }
}

module.exports = HealthController
