'use strict'

const { Controller } = require('egg')

class AuthController extends Controller {
  async login() {
    const { ctx } = this
    const { account, password, captcha } = ctx.request.body || {}

    if (!account || !password || !captcha) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '账号、密码和验证码不能为空',
        data: null,
      }
      return
    }

    const session = ctx.service.auth.authenticate({
      account: String(account).trim(),
      password: String(password),
      captcha: String(captcha).trim(),
    })

    if (!session) {
      ctx.status = 401
      ctx.body = {
        code: 401,
        message: '账号、密码或验证码不正确',
        data: null,
      }
      return
    }

    ctx.body = {
      code: 200,
      message: '登录成功',
      data: session,
    }
  }

  async logout() {
    const { ctx } = this

    ctx.service.auth.revokeToken(ctx.state.authToken)
    ctx.body = {
      code: 200,
      message: '退出成功',
      data: null,
    }
  }
}

module.exports = AuthController
