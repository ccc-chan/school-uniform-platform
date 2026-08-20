'use strict'

/**
 * 校验 Bearer Token，并将解析出的登录信息写入请求上下文。
 * 后续权限中间件依赖 ctx.state.user，因此该中间件必须先执行。
 */
module.exports = () => {
  return async function auth(ctx, next) {
    // 只接受标准 Bearer 认证头，其他格式统一视为无有效令牌。
    const authorization = ctx.get('authorization')
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : ''

    // resolveToken 同时校验令牌有效期、会话状态和账号状态。
    const profile = await ctx.service.auth.resolveToken(token)

    if (!profile) {
      ctx.status = 401
      ctx.body = {
        code: 401,
        message: '登录状态已失效，请重新登录',
        data: null,
      }
      return
    }

    // 保存原始令牌供退出登录、修改密码等会话撤销操作使用。
    ctx.state.authToken = token
    ctx.state.user = profile
    await next()
  }
}
