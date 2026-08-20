'use strict'

/**
 * 校验模块内部的具体操作权限，例如创建、编辑、删除或字段查看。
 * 菜单权限决定能否进入模块，操作权限进一步限制模块内能力。
 */
module.exports = ({ code }) => async function operationPermission(ctx, next) {
  if (!(await ctx.service.auth.hasPermission(ctx.state.user.id, code))) {
    ctx.status = 403; ctx.body = { code: 403, message: '无权执行该操作', data: null }; return
  }
  await next()
}
