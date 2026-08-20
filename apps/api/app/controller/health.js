'use strict'

const { Controller } = require('egg')

/**
 * 提供无需认证的服务健康检查，供部署平台和监控系统探测。
 */
class HealthController extends Controller {
  async index() {
    // Redis 是认证链路关键依赖，健康检查同时验证 Redis 连接。
    const redisStatus =
      await this.app.redis.ping() === 'PONG' ? 'ok' : 'error'

    this.ctx.body = {
      code: 200,
      message: 'success',
      data: {
        service: 'school-uniform-api',
        status: redisStatus === 'ok' ? 'ok' : 'degraded',
        dependencies: {
          redis: redisStatus,
        },
        timestamp: this.ctx.helper.formatDateTime(new Date()),
      },
    }
  }
}

module.exports = HealthController
