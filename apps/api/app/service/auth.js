'use strict'

const { randomUUID } = require('node:crypto')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { Service } = require('egg')

const SESSION_DURATION = 24 * 60 * 60 * 1000

class AuthService extends Service {
  async authenticate({ account, password, captcha }) {
    if (String(captcha).toUpperCase() !== '7K9P') return null
    const employee = await this.app.model.Employee.findOne({ where: { account, status: 'enabled' }, include: [{ model: this.app.model.Role, as: 'roles', attributes: ['id', 'name', 'code'], through: { attributes: [] } }] })
    if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) return null
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)
    await this.app.model.Session.create({ employeeId: employee.id, token, expiresAt })
    await employee.update({ lastLoginAt: new Date() })
    const role = employee.roles[0]
    return { token, expiresAt: expiresAt.toISOString(), profile: { id: Number(employee.id), account: employee.account, name: employee.name, role: role?.name || '未分配角色' } }
  }

  async resolveToken(token) {
    await this.app.model.Session.destroy({ where: { expiresAt: { [Op.lte]: new Date() } } })
    const session = await this.app.model.Session.findOne({ where: { token }, include: [{ model: this.app.model.Employee, as: 'employee', include: [{ model: this.app.model.Role, as: 'roles', through: { attributes: [] } }] }] })
    const employee = session?.employee
    if (!employee || employee.status !== 'enabled') return null
    return { id: Number(employee.id), account: employee.account, name: employee.name, role: employee.roles[0]?.name || '未分配角色' }
  }

  async revokeToken(token) { await this.app.model.Session.destroy({ where: { token } }) }
}

module.exports = AuthService
