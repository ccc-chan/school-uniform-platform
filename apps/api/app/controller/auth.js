'use strict'

const { Controller } = require('egg')

/**
 * 处理登录凭证、密码和当前用户授权信息。
 * 控制器负责基础参数校验，令牌及密码安全逻辑由认证服务统一实现。
 */
class AuthController extends Controller {
  async captcha() {
    const { ctx } = this
    // 验证码写入 Redis 后再返回演示代码，确保 Cookie 只保存随机标识。
    const code = await ctx.service.auth.createCaptcha()

    ctx.body = {
      code: 200,
      message: '获取验证码成功',
      data: { code },
    }
  }

  async login() {
    const { ctx } = this
    const { account, password, captcha } = ctx.request.body || {}

    // 在调用认证服务前拒绝缺失字段，避免产生无意义的密码校验开销。
    if (!account || !password || !captcha) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '账号、密码和验证码不能为空',
        data: null,
      }
      return
    }

    const session = await ctx.service.auth.authenticate({
      account: String(account).trim(),
      password: String(password),
      captcha: String(captcha).trim(),
    })

    // 使用统一错误文案，避免向匿名请求泄露账号是否存在。
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

  async resetPassword() {
    // 密码重置同时核对账号与绑定手机号。
    const { ctx } = this
    const { account, phone, password } = ctx.request.body || {}

    if (!account || !phone || !password) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '账号、手机号和新密码不能为空',
        data: null,
      }
      return
    }

    if (String(password).length < 6) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '新密码不能少于 6 位',
        data: null,
      }
      return
    }

    const success = await ctx.service.auth.resetPassword({
      account: String(account).trim(),
      phone: String(phone).trim(),
      password: String(password),
    })

    if (!success) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '账号或绑定手机号不正确',
        data: null,
      }
      return
    }

    ctx.body = {
      code: 200,
      message: '密码重置成功',
      data: null,
    }
  }

  async changePassword() {
    // 当前用户 ID 和令牌由认证中间件写入 ctx.state，不接受客户端指定。
    const { ctx } = this
    const { currentPassword, newPassword } = ctx.request.body || {}

    if (!currentPassword || !newPassword) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '原密码和新密码不能为空',
        data: null,
      }
      return
    }

    if (String(newPassword).length < 6) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '新密码不能少于 6 位',
        data: null,
      }
      return
    }

    if (String(currentPassword) === String(newPassword)) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '新密码不能与原密码相同',
        data: null,
      }
      return
    }

    const success = await ctx.service.auth.changePassword({
      employeeId: ctx.state.user.id,
      currentToken: ctx.state.authToken,
      currentPassword: String(currentPassword),
      newPassword: String(newPassword),
    })

    if (!success) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '原密码不正确',
        data: null,
      }
      return
    }

    ctx.body = {
      code: 200,
      message: '密码修改成功',
      data: null,
    }
  }

  async menus() {
    // 菜单决定用户可进入的功能模块。
    const { ctx } = this
    ctx.body = {
      code: 200,
      message: '获取菜单成功',
      data: await ctx.service.auth.getMenus(ctx.state.user.id),
    }
  }

  async permissions() {
    // 操作权限用于控制模块内按钮、字段和增删改能力。
    const { ctx } = this
    ctx.body = { code: 200, message: '获取权限成功', data: await ctx.service.auth.getPermissions(ctx.state.user.id) }
  }

  async logout() {
    const { ctx } = this

    // 只撤销当前请求携带的会话令牌，不影响用户的其他登录设备。
    await ctx.service.auth.revokeToken(ctx.state.authToken)
    ctx.body = {
      code: 200,
      message: '退出成功',
      data: null,
    }
  }
}

module.exports = AuthController
