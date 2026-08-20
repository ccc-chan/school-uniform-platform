'use strict'

const { Op } = require('sequelize')

/**
 * 定期删除已过期的登录会话，控制会话表体积。
 */
module.exports = {
  schedule: {
    // 每 15 分钟由单个 worker 执行一次，应用启动时不立即触发。
    cron: '0 */15 * * * *',
    type: 'worker',
    immediate: false,
  },

  async task(ctx) {
    // 数据库直接批量删除 expiresAt 不晚于当前时间的会话。
    const removed = await ctx.app.model.Session.destroy({
      where: {
        expiresAt: { [Op.lte]: new Date() },
      },
    })

    if (removed) {
      ctx.logger.info(
        '[session-cleanup] removed %d expired sessions',
        removed,
      )
    }
  },
}
