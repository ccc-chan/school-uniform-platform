'use strict'

module.exports = () => {
  return async function auth(ctx, next) {
    const authorization = ctx.get('authorization')
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : ''
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

    ctx.state.authToken = token
    ctx.state.user = profile
    await next()
  }
}
