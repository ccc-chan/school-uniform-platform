'use strict'

const { Controller } = require('egg')

/**
 * 聚合管理端首页所需的指标、趋势和待办数据。
 */
class DashboardController extends Controller {
  async overview() {
    this.ctx.body = {
      code: 200,
      message: 'success',
      data: await this.ctx.service.dashboard.overview(),
    }
  }

  async scanTrend() {
    const days = parseInt(this.ctx.query.days) || 7
    this.ctx.body = {
      code: 200,
      message: 'success',
      data: await this.ctx.service.dashboard.scanTrend(days),
    }
  }
}

module.exports = DashboardController
