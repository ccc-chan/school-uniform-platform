'use strict'

const { Controller } = require('egg')

/**
 * 数据分析接口控制器，同时承接无需登录的消费者扫码入口。
 */
class AnalyticsController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  async options() {
    this.ok(await this.ctx.service.analytics.options())
  }

  async overview() {
    this.ok(await this.ctx.service.analytics.overview(this.ctx.query))
  }

  async recordScan() {
    // 公开接口先限制二维码编号长度，避免无效值进入查询和日志链路。
    const code = String(this.ctx.params.code || '').trim()
    if (!code || code.length > 40) return this.fail('二维码编号无效')
    const item = await this.ctx.service.analytics.recordScan(
      code,
      this.ctx.request.body || {},
    )
    return item
      ? this.ok(item, '扫码记录成功')
      : this.fail('二维码不存在或已作废', 404)
  }
}

module.exports = AnalyticsController
