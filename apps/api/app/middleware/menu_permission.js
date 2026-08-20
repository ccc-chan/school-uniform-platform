'use strict'

/**
 * 校验用户是否拥有指定菜单，用于控制整个业务模块的访问权。
 * 该中间件应位于 auth 之后，确保 ctx.state.user 已存在。
 */
module.exports = ({ code }) => {
  return async function menuPermission(ctx, next) {
    // 菜单权限来自当前用户关联角色的有效菜单集合。
    const allowed = await ctx.service.auth.hasMenu(ctx.state.user.id, code)

    if (!allowed) {
      ctx.status = 403
      ctx.body = {
        code: 403,
        message: '无权访问该功能',
        data: null,
      }
      return
    }

    await next()
  }
}
