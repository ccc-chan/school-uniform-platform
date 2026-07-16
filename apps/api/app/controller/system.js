'use strict'

const { Controller } = require('egg')

class SystemController extends Controller {
  success(data, message = 'success') { this.ctx.body = { code: 200, message, data } }
  fail(message, status = 400) { this.ctx.status = status; this.ctx.body = { code: status, message, data: null } }

  async employees() { this.success(await this.ctx.service.system.listEmployees(this.ctx.query)) }
  async roles() { this.success(await this.ctx.service.system.listRoles(this.ctx.query)) }

  async createEmployee() {
    const payload = this.ctx.request.body
    if (!payload.name || !payload.phone || !payload.account || !payload.roleId || !payload.department) return this.fail('请完整填写员工信息')
    try { const result = await this.ctx.service.system.createEmployee(payload); return result ? this.success(result, '员工账号创建成功') : this.fail('角色不存在', 404) } catch (error) { if (error.name === 'SequelizeUniqueConstraintError') return this.fail('登录账号或手机号已存在'); throw error }
  }

  async updateEmployee() {
    try { const result = await this.ctx.service.system.updateEmployee(Number(this.ctx.params.id), this.ctx.request.body); return result ? this.success(result, '员工信息更新成功') : this.fail('员工或角色不存在', 404) } catch (error) { if (error.name === 'SequelizeUniqueConstraintError') return this.fail('手机号已被其他账号使用'); throw error }
  }

  async updateEmployeeStatus() { const result = await this.ctx.service.system.updateEmployeeStatus(Number(this.ctx.params.id), this.ctx.request.body.status); return result ? this.success(result, '账号状态更新成功') : this.fail('员工不存在', 404) }
  async resetEmployeePassword() { const result = await this.ctx.service.system.resetEmployeePassword(Number(this.ctx.params.id)); return result ? this.success(result, '密码已重置') : this.fail('员工不存在', 404) }

  async createRole() {
    const payload = this.ctx.request.body
    if (!payload.name || !payload.code || !payload.dataScope) return this.fail('请完整填写角色信息')
    try { this.success(await this.ctx.service.system.createRole(payload), '角色创建成功') } catch (error) { if (error.name === 'SequelizeUniqueConstraintError') return this.fail('角色编码已存在'); throw error }
  }

  async updateRole() { const result = await this.ctx.service.system.updateRole(Number(this.ctx.params.id), this.ctx.request.body); return result ? this.success(result, '角色更新成功') : this.fail('角色不存在', 404) }
  async updateRoleStatus() { const result = await this.ctx.service.system.updateRoleStatus(Number(this.ctx.params.id), this.ctx.request.body.status); if (!result) return this.fail('角色不存在', 404); if (result.conflict) return this.fail('该角色仍有关联员工，不能停用'); return this.success(result, '角色状态更新成功') }
}

module.exports = SystemController
