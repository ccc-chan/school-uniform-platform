'use strict'

const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { Service } = require('egg')

const scopeLabels = { all: '全部数据', department_and_children: '本部门及下级部门', department: '本部门数据', self: '本人数据' }
const scopeValues = Object.fromEntries(Object.entries(scopeLabels).map(([key, value]) => [value, key]))

class SystemService extends Service {
  async log(action, targetType, targetId, detail = null, transaction = null) {
    await this.app.model.OperationLog.create({ employeeId: this.ctx.state.user?.id || null, module: '系统管理', action, targetType, targetId, detail, ip: this.ctx.ip }, { transaction })
  }

  employeeJson(item) {
    const role = item.roles?.[0]
    return { id: Number(item.id), name: item.name, phone: item.phone, account: item.account, roleId: Number(role?.id || 0), roleName: role?.name || '未分配角色', department: item.department?.name || '-', status: item.status, createdAt: item.createdAt, lastLoginAt: item.lastLoginAt || '-' }
  }

  roleJson(item) {
    return { id: Number(item.id), name: item.name, code: item.code, description: item.description, dataScope: scopeLabels[item.dataScope] || '本人数据', menuPermissions: (item.menus || []).map((menu) => menu.code), operationPermissions: (item.permissions || []).map((permission) => permission.code), employeeCount: Number(item.get('employeeCount') || item.employees?.length || 0), status: item.status, createdAt: item.createdAt }
  }

  async listEmployees(query) {
    const keyword = String(query.keyword || '').trim()
    const roleId = Number(query.roleId || 0), status = String(query.status || '')
    const page = Math.max(1, Number(query.page || 1)), pageSize = Math.min(50, Math.max(1, Number(query.pageSize || 10)))
    const where = {}
    if (keyword) where[Op.or] = [...['name', 'account', 'phone'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } })), { '$department.name$': { [Op.like]: `%${keyword}%` } }]
    if (status) where.status = status
    const roleWhere = roleId ? { id: roleId } : undefined
    const { rows, count } = await this.app.model.Employee.findAndCountAll({ where, include: [{ model: this.app.model.Department, as: 'department', required: false }, { model: this.app.model.Role, as: 'roles', where: roleWhere, required: Boolean(roleId), through: { attributes: [] } }], distinct: true, order: [['id', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize })
    return { items: rows.map((item) => this.employeeJson(item)), total: count, page, pageSize }
  }

  async listRoles(query = {}) {
    const keyword = String(query.keyword || '').trim()
    const where = keyword ? { [Op.or]: ['name', 'code', 'description'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } })) } : {}
    const rows = await this.app.model.Role.findAll({ where, attributes: { include: [[this.app.Sequelize.literal('(SELECT COUNT(*) FROM sys_employee_roles er WHERE er.role_id = Role.id)'), 'employeeCount']] }, include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], order: [['id', 'ASC']] })
    return rows.map((item) => this.roleJson(item))
  }

  async createEmployee(payload) {
    return this.app.model.transaction(async (transaction) => {
      const [department] = await this.app.model.Department.findOrCreate({ where: { name: payload.department }, defaults: { code: `DEPT_${Date.now()}`, status: 'enabled' }, transaction })
      const role = await this.app.model.Role.findByPk(Number(payload.roleId), { transaction })
      if (!role) return null
      const employee = await this.app.model.Employee.create({ departmentId: department.id, name: payload.name, phone: payload.phone, account: payload.account, passwordHash: await bcrypt.hash('Uniform@123', 12), status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction })
      await employee.setRoles([role], { transaction })
      await this.log('新增员工', 'employee', employee.id, { account: employee.account }, transaction)
      return this.employeeJson(await this.app.model.Employee.findByPk(employee.id, { include: [{ model: this.app.model.Department, as: 'department' }, { model: this.app.model.Role, as: 'roles', through: { attributes: [] } }], transaction }))
    })
  }

  async updateEmployee(id, payload) {
    return this.app.model.transaction(async (transaction) => {
      const employee = await this.app.model.Employee.findByPk(id, { transaction }), role = await this.app.model.Role.findByPk(Number(payload.roleId), { transaction })
      if (!employee || !role) return null
      const [department] = await this.app.model.Department.findOrCreate({ where: { name: payload.department }, defaults: { code: `DEPT_${Date.now()}`, status: 'enabled' }, transaction })
      await employee.update({ departmentId: department.id, name: payload.name, phone: payload.phone, status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction })
      await employee.setRoles([role], { transaction })
      await this.log('编辑员工', 'employee', employee.id, { account: employee.account }, transaction)
      return this.employeeJson(await this.app.model.Employee.findByPk(id, { include: [{ model: this.app.model.Department, as: 'department' }, { model: this.app.model.Role, as: 'roles', through: { attributes: [] } }], transaction }))
    })
  }

  async updateEmployeeStatus(id, status) { const employee = await this.app.model.Employee.findByPk(id); if (!employee) return null; await employee.update({ status: status === 'disabled' ? 'disabled' : 'enabled' }); await this.log('更新账号状态', 'employee', id, { status: employee.status }); return this.employeeJson(await this.app.model.Employee.findByPk(id, { include: [{ model: this.app.model.Department, as: 'department' }, { model: this.app.model.Role, as: 'roles', through: { attributes: [] } }] })) }
  async resetEmployeePassword(id) { const employee = await this.app.model.Employee.findByPk(id); if (!employee) return null; const temporaryPassword = 'Uniform@123'; await employee.update({ passwordHash: await bcrypt.hash(temporaryPassword, 12) }); await this.app.model.Session.destroy({ where: { employeeId: id } }); await this.log('重置密码', 'employee', id); return { temporaryPassword } }

  async applyRolePermissions(role, payload, transaction) {
    const menus = await this.app.model.Menu.findAll({ where: { code: payload.menuPermissions || [] }, transaction })
    const permissions = await this.app.model.Permission.findAll({ where: { code: payload.operationPermissions || [] }, transaction })
    await role.setMenus(menus, { transaction }); await role.setPermissions(permissions, { transaction })
  }

  async createRole(payload) { return this.app.model.transaction(async (transaction) => { const role = await this.app.model.Role.create({ name: payload.name, code: payload.code, description: payload.description || '', dataScope: scopeValues[payload.dataScope] || 'self', status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction }); await this.applyRolePermissions(role, payload, transaction); await this.log('新增角色', 'role', role.id, { code: role.code }, transaction); return this.roleJson(await this.app.model.Role.findByPk(role.id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], transaction })) }) }
  async updateRole(id, payload) { return this.app.model.transaction(async (transaction) => { const role = await this.app.model.Role.findByPk(id, { transaction }); if (!role) return null; await role.update({ name: payload.name, description: payload.description || '', dataScope: scopeValues[payload.dataScope] || 'self', status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction }); await this.applyRolePermissions(role, payload, transaction); await this.log('编辑角色', 'role', id, { code: role.code }, transaction); return this.roleJson(await this.app.model.Role.findByPk(id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], transaction })) }) }
  async updateRoleStatus(id, status) { const role = await this.app.model.Role.findByPk(id); if (!role) return null; const employeeCount = await this.app.model.EmployeeRole.count({ where: { roleId: id } }); if (status === 'disabled' && employeeCount) return { conflict: true }; await role.update({ status: status === 'disabled' ? 'disabled' : 'enabled' }); await this.log('更新角色状态', 'role', id, { status: role.status }); return this.roleJson(await this.app.model.Role.findByPk(id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }] })) }
}

module.exports = SystemService
