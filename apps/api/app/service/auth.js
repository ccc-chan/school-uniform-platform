'use strict'

const { randomInt, randomUUID } = require('node:crypto')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { Service } = require('egg')

const SESSION_DURATION = 24 * 60 * 60 * 1000
const CAPTCHA_DURATION = 5 * 60 * 1000
const CAPTCHA_COOKIE = 'login_captcha'
const CAPTCHA_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/**
 * 管理验证码、密码校验、会话令牌及用户菜单权限。
 */
class AuthService extends Service {
  profile(employee) {
    const role = employee.roles?.[0]
    return {
      id: Number(employee.id),
      account: employee.account,
      name: employee.name,
      role: role?.name || '未分配角色',
      roleCode: role?.code || '',
    }
  }

  async createCaptcha() {
    const code = Array.from(
      { length: 4 },
      () => CAPTCHA_CHARACTERS[randomInt(CAPTCHA_CHARACTERS.length)],
    ).join('')

    // Cookie 只保存随机验证码标识，真实验证码由 Redis 按 TTL 保存。
    const captchaId = await this.ctx.service.cache.storeCaptcha(
      code,
      Math.ceil(CAPTCHA_DURATION / 1000),
    )

    this.ctx.cookies.set(CAPTCHA_COOKIE, captchaId, {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: CAPTCHA_DURATION,
      overwrite: true,
    })

    return code
  }

  async verifyCaptcha(captcha) {
    const captchaId = this.ctx.cookies.get(CAPTCHA_COOKIE, {
      signed: true,
    })

    // 验证码读取后立即删除，确保同一个验证码只能尝试一次。
    this.ctx.cookies.set(CAPTCHA_COOKIE, null, {
      signed: true,
      overwrite: true,
    })

    // Redis 原子读取并删除验证码，确保同一验证码只能验证一次。
    const expectedCaptcha =
      await this.ctx.service.cache.takeCaptcha(captchaId)

    return Boolean(
      expectedCaptcha
      && String(captcha).toUpperCase() === expectedCaptcha,
    )
  }

  async authenticate({ account, password, captcha }) {
    // 先验证一次性验证码，再进行账号查询和 bcrypt 密码比对。
    if (!(await this.verifyCaptcha(captcha))) return null
    const employee = await this.app.model.Employee.findOne({ where: { account, status: 'enabled' }, include: [{ model: this.app.model.Role, as: 'roles', attributes: ['id', 'name', 'code'], through: { attributes: [] } }] })
    if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) return null
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)
    const profile = this.profile(employee)

    // 迁移期同时写 MySQL 和 Redis；Redis 失败时删除刚创建的数据库会话。
    const databaseSession = await this.app.model.Session.create({
      employeeId: employee.id,
      token,
      expiresAt,
    })
    try {
      await this.ctx.service.cache.storeSession({
        token,
        employeeId: employee.id,
        expiresAt,
        profile,
      })
    } catch (error) {
      await databaseSession.destroy()
      throw error
    }

    await employee.update({ lastLoginAt: new Date() })
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      profile,
    }
  }

  async resetPassword({ account, phone, password }) {
    const employee = await this.app.model.Employee.findOne({
      where: { account, phone, status: 'enabled' },
    })

    if (!employee) return false

    await employee.update({
      passwordHash: await bcrypt.hash(password, 12),
    })
    // 重置密码后同时撤销 Redis 和 MySQL 会话，要求所有设备重新登录。
    await Promise.all([
      this.app.model.Session.destroy({
        where: { employeeId: employee.id },
      }),
      this.ctx.service.cache.removeUserSessions(employee.id),
    ])

    return true
  }

  async changePassword({
    employeeId,
    currentToken,
    currentPassword,
    newPassword,
  }) {
    const employee = await this.app.model.Employee.findByPk(employeeId)

    if (
      !employee
      || !(await bcrypt.compare(currentPassword, employee.passwordHash))
    ) {
      return false
    }

    await employee.update({
      passwordHash: await bcrypt.hash(newPassword, 12),
    })

    // 修改密码保留当前会话，同时撤销 Redis 和 MySQL 中的其他设备会话。
    await Promise.all([
      this.app.model.Session.destroy({
        where: {
          employeeId,
          token: { [Op.ne]: currentToken },
        },
      }),
      this.ctx.service.cache.removeUserSessions(employeeId, currentToken),
    ])

    return true
  }

  async getMenus(employeeId) {
    // 同一请求可能多次检查权限，因此为当前用户缓存已解析的菜单集合。
    const isCurrentUser =
      Number(employeeId) === Number(this.ctx.state.user?.id)
    if (isCurrentUser && this.ctx.state.authorizationCache?.menus) {
      return this.ctx.state.authorizationCache.menus
    }

    const menus = await this.ctx.service.cache.rememberAuthorization(
      'menus',
      employeeId,
      async () => {
        const employee = await this.app.model.Employee.findByPk(employeeId, {
          include: [{
            model: this.app.model.Role,
            as: 'roles',
            where: { status: 'enabled' },
            required: false,
            through: { attributes: [] },
            include: [{
              model: this.app.model.Menu,
              as: 'menus',
              where: { status: 'enabled' },
              required: false,
              through: { attributes: [] },
            }],
          }],
        })

        const menuMap = new Map()
        for (const role of employee?.roles || []) {
          for (const menu of role.menus || []) {
            menuMap.set(menu.code, {
              id: Number(menu.id),
              name: menu.name,
              code: menu.code,
              path: menu.path,
              parentId: menu.parentId ? Number(menu.parentId) : null,
              sort: Number(menu.sort || 0),
            })
          }
        }

        return [...menuMap.values()].sort((a, b) => a.sort - b.sort)
      },
    )
    if (isCurrentUser) {
      this.ctx.state.authorizationCache ||= {}
      this.ctx.state.authorizationCache.menus = menus
    }
    return menus
  }

  async hasMenu(employeeId, code) {
    return (await this.getMenus(employeeId))
      .some((menu) => menu.code === code)
  }

  async getPermissions(employeeId) {
    // 操作权限同样使用请求级缓存，不跨请求保存以免角色更新后产生旧数据。
    const isCurrentUser =
      Number(employeeId) === Number(this.ctx.state.user?.id)
    if (isCurrentUser && this.ctx.state.authorizationCache?.permissions) {
      return this.ctx.state.authorizationCache.permissions
    }

    const permissions = await this.ctx.service.cache.rememberAuthorization(
      'permissions',
      employeeId,
      async () => {
        const employee = await this.app.model.Employee.findByPk(employeeId, {
          include: [{
            model: this.app.model.Role,
            as: 'roles',
            where: { status: 'enabled' },
            required: false,
            through: { attributes: [] },
            include: [{
              model: this.app.model.Permission,
              as: 'permissions',
              through: { attributes: [] },
            }],
          }],
        })
        return [
          ...new Set(
            (employee?.roles || [])
              .flatMap((role) =>
                (role.permissions || []).map((item) => item.code),
              ),
          ),
        ]
      },
    )

    if (isCurrentUser) {
      this.ctx.state.authorizationCache ||= {}
      this.ctx.state.authorizationCache.permissions = permissions
    }
    return permissions
  }

  async hasPermission(employeeId, code) {
    return (await this.getPermissions(employeeId)).includes(code)
  }

  async resolveToken(token) {
    // Redis 命中时不再为每个请求访问 sys_sessions。
    const cached = await this.ctx.service.cache.readSession(token)
    if (cached?.profile) return cached.profile

    // 迁移期 Redis 未命中时回查 MySQL，并按原过期时间回填 Redis。
    const session = await this.app.model.Session.findOne({
      where: {
        token,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{
        model: this.app.model.Employee,
        as: 'employee',
        include: [{
          model: this.app.model.Role,
          as: 'roles',
          through: { attributes: [] },
        }],
      }],
    })
    const employee = session?.employee
    if (!employee || employee.status !== 'enabled') return null
    const profile = this.profile(employee)
    await this.ctx.service.cache.storeSession({
      token,
      employeeId: employee.id,
      expiresAt: session.expiresAt,
      profile,
    })
    return profile
  }

  async revokeToken(token) {
    // 两个删除操作同时启动，迁移期保持 Redis 与 MySQL 状态一致。
    await Promise.all([
      this.ctx.service.cache.removeSession(token),
      this.app.model.Session.destroy({ where: { token } }),
    ])
  }
}

module.exports = AuthService
