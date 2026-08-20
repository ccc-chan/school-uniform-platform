'use strict'

/**
 * 限制高风险操作只能由超级管理员执行。
 * 当前主要用于删除账号、角色和系统文件等不可轻易恢复的操作。
 */
module.exports = () => {
  return async function superAdmin(ctx, next) {
    // 使用认证阶段写入的角色编码判断，避免信任客户端提交的身份信息。
    if (ctx.state.user?.roleCode !== 'SUPER_ADMIN') {
      ctx.status = 403
      ctx.body = {
        code: 403,
        message: '只有超级管理员可以执行删除操作',
        data: null,
      }
      return
    }

    await next()
  }
}
