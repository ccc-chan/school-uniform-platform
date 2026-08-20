'use strict'

const bcrypt = require('bcryptjs')
const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Op } = require('sequelize')
const { Service } = require('egg')

const scopeLabels = { all: '全部数据', department_and_children: '本部门及下级部门', department: '本部门数据', self: '本人数据' }
const scopeValues = Object.fromEntries(Object.entries(scopeLabels).map(([key, value]) => [value, key]))
const editableMenuCodes = new Set([
  'shortcut_dashboard',
  'shortcut_products',
  'shortcut_label_print',
  'shortcut_company_settings',
  'shortcut_system',
])
const editableOperationCodes = new Set([
  'view',
  'create',
  'edit',
  'delete',
  'export',
])

/**
 * 管理员工、角色授权、操作日志和通用系统文件。
 */
class SystemService extends Service {
  async log(action, targetType, targetId, detail = null, transaction = null) {
    const log = await this.app.model.OperationLog.create({
      employeeId: this.ctx.state.user?.id || null,
      module: '系统管理',
      action,
      targetType,
      targetId,
      detail: {
        request: {
          method: this.ctx.method,
          path: this.ctx.path,
          params: this.ctx.params,
          query: this.ctx.query,
          body: this.ctx.request.body,
          files: (this.ctx.request.files || []).map((file) => ({
            name: file.filename,
            mimeType: file.mime,
          })),
        },
        response: null,
        context: detail,
      },
      ip: this.ctx.ip,
    }, { transaction })

    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(log.id))
  }

  async invalidateAuthorization() {
    // 员工角色或角色权限变化后，递增 Redis 权限版本。
    await this.ctx.service.cache.invalidateAuthorization()
  }

  async revokeEmployeeSessions(employeeId) {
    // 员工状态、角色或密码变化后，同时撤销 Redis 和 MySQL 会话。
    await Promise.all([
      this.app.model.Session.destroy({
        where: { employeeId },
      }),
      this.ctx.service.cache.removeUserSessions(employeeId),
    ])
  }

  employeeJson(item) {
    const role = item.roles?.[0]
    return {
      id: Number(item.id),
      name: item.name,
      phone: item.phone,
      account: item.account,
      roleId: Number(role?.id || 0),
      roleName: role?.name || '未分配角色',
      department: item.department?.name || '-',
      status: item.status,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
      lastLoginAt: this.ctx.helper.formatDateTime(item.lastLoginAt),
    }
  }

  roleJson(item) {
    return {
      id: Number(item.id),
      name: item.name,
      code: item.code,
      description: item.description,
      dataScope: scopeLabels[item.dataScope] || '本人数据',
      menuPermissions: (item.menus || [])
        .map((menu) => menu.code)
        .filter((code) => editableMenuCodes.has(code)),
      operationPermissions: (item.permissions || [])
        .map((permission) => permission.code)
        .filter((code) => editableOperationCodes.has(code)),
      employeeCount: Number(item.get('employeeCount') || item.employees?.length || 0),
      status: item.status,
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
    }
  }

  async listOperationLogs(query) {
    const keyword = String(query.keyword || '').trim()
    const moduleName = String(query.module || '').trim()
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const where = {}
    if (moduleName) where.module = moduleName
    if (keyword) where[Op.or] = ['action', 'targetType', 'ip'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
    if (query.startAt || query.endAt) {
      where.createdAt = {}
      if (query.startAt) where.createdAt[Op.gte] = new Date(String(query.startAt))
      if (query.endAt) where.createdAt[Op.lte] = new Date(String(query.endAt))
    }
    const { rows, count } = await this.app.model.OperationLog.findAndCountAll({ where, order: [['id', 'DESC']], limit: pageSize, offset })
    const employeeIds = [...new Set(rows.map((item) => Number(item.employeeId)).filter(Boolean))]
    const employees = employeeIds.length ? await this.app.model.Employee.findAll({ where: { id: employeeIds }, attributes: ['id', 'name', 'account'] }) : []
    const employeeMap = new Map(employees.map((item) => [Number(item.id), item]))
    return {
      items: rows.map((item) => {
        const employee = employeeMap.get(Number(item.employeeId))
        return {
          id: Number(item.id),
          operator: employee
            ? `${employee.name}（${employee.account}）`
            : '系统',
          module: item.module,
          action: item.action,
          targetType: item.targetType || '-',
          targetId: item.targetId ? Number(item.targetId) : null,
          detail: item.detail,
          ip: item.ip || '-',
          createdAt: this.ctx.helper.formatDateTime(item.createdAt),
        }
      }),
      total: count,
      page,
      pageSize,
    }
  }

  fileJson(item, uploader = null) {
    return {
      id: Number(item.id),
      name: item.originalName,
      mimeType: item.mimeType,
      category: item.category,
      size: Number(item.size),
      uploader: uploader
        ? `${uploader.name}（${uploader.account}）`
        : '系统',
      createdAt: this.ctx.helper.formatDateTime(item.createdAt),
    }
  }

  async listFiles(query) {
    const keyword = String(query.keyword || '').trim(), category = String(query.category || '')
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const where = {}
    if (keyword) where.originalName = { [Op.like]: `%${keyword}%` }
    if (category) where.category = category
    const { rows, count } = await this.app.model.File.findAndCountAll({ where, order: [['id', 'DESC']], limit: pageSize, offset })
    const employeeIds = [...new Set(rows.map((item) => Number(item.uploadedBy)).filter(Boolean))]
    const employees = employeeIds.length ? await this.app.model.Employee.findAll({ where: { id: employeeIds }, attributes: ['id', 'name', 'account'] }) : []
    const employeeMap = new Map(employees.map((item) => [Number(item.id), item]))
    return { items: rows.map((item) => this.fileJson(item, employeeMap.get(Number(item.uploadedBy)))), total: count, page, pageSize }
  }

  async saveFile(file) {
    // 物理文件先落盘；数据库事务失败时删除文件作为补偿。
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
    if (!allowed.has(file.mime)) return { invalid: true }
    const extension = path.extname(file.filename).toLowerCase() || (file.mime === 'application/pdf' ? '.pdf' : '')
    const storedName = `${crypto.randomUUID()}${extension}`
    const uploadDir = path.join(this.app.baseDir, 'storage', 'uploads')
    await fsp.mkdir(uploadDir, { recursive: true })
    const targetPath = path.join(uploadDir, storedName)
    const size = (await fsp.stat(file.filepath)).size
    await fsp.copyFile(file.filepath, targetPath)

    try {
      return await this.app.model.transaction(async (transaction) => {
        const item = await this.app.model.File.create(
          {
            originalName: file.filename,
            storedName,
            mimeType: file.mime,
            category: file.mime === 'application/pdf' ? 'report' : 'image',
            size,
            uploadedBy: this.ctx.state.user.id,
          },
          { transaction },
        )
        await this.log(
          '上传文件',
          'file',
          item.id,
          { name: item.originalName },
          transaction,
        )
        return this.fileJson(item, this.ctx.state.user)
      })
    } catch (error) {
      await fsp.unlink(targetPath).catch((cleanupError) => {
        this.ctx.logger.error(
          '[system-file] cleanup failed for %s: %s',
          targetPath,
          cleanupError.message,
        )
      })
      throw error
    }
  }

  async getFile(id) {
    const item = await this.app.model.File.findByPk(id)
    if (!item) return null
    const filePath = path.join(this.app.baseDir, 'storage', 'uploads', item.storedName)
    try { await fsp.access(filePath) } catch { return null }
    return { item, stream: fs.createReadStream(filePath) }
  }

  async deleteFile(id) {
    // 先在事务内记录日志并删除元数据，提交后再尝试删除物理文件。
    const item = await this.app.model.File.findByPk(id)
    if (!item) return null
    await this.app.model.transaction(async (transaction) => {
      await this.log(
        '删除文件',
        'file',
        item.id,
        { name: item.originalName },
        transaction,
      )
      await item.destroy({ transaction })
    })

    const targetPath = path.join(
      this.app.baseDir,
      'storage',
      'uploads',
      item.storedName,
    )
    await fsp.unlink(targetPath).catch((error) => {
      if (error.code !== 'ENOENT') {
        this.ctx.logger.error(
          '[system-file] physical delete failed for %s: %s',
          targetPath,
          error.message,
        )
      }
    })
    return { success: true }
  }

  async listEmployees(query) {
    const keyword = String(query.keyword || '').trim()
    const roleId = Number(query.roleId || 0), status = String(query.status || '')
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const where = {}
    if (keyword) where[Op.or] = [...['name', 'account', 'phone'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } })), { '$department.name$': { [Op.like]: `%${keyword}%` } }]
    if (status) where.status = status
    const roleWhere = roleId ? { id: roleId } : undefined
    const { rows, count } = await this.app.model.Employee.findAndCountAll({ where, include: [{ model: this.app.model.Department, as: 'department', required: false }, { model: this.app.model.Role, as: 'roles', where: roleWhere, required: Boolean(roleId), through: { attributes: [] } }], distinct: true, order: [['id', 'DESC']], limit: pageSize, offset })
    return { items: rows.map((item) => this.employeeJson(item)), total: count, page, pageSize }
  }

  async listRoles(query = {}) {
    const keyword = String(query.keyword || '').trim()
    const where = keyword ? { [Op.or]: ['name', 'code', 'description'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } })) } : {}
    const rows = await this.app.model.Role.findAll({ where, attributes: { include: [[this.app.Sequelize.literal('(SELECT COUNT(*) FROM sys_employee_roles er WHERE er.role_id = Role.id)'), 'employeeCount']] }, include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], order: [['id', 'ASC']] })
    return rows.map((item) => this.roleJson(item))
  }

  async createEmployee(payload) {
    // 员工、部门关联、角色关联和审计日志在同一事务内完成。
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
    const result = await this.app.model.transaction(async (transaction) => {
      const employee = await this.app.model.Employee.findByPk(id, { transaction }), role = await this.app.model.Role.findByPk(Number(payload.roleId), { transaction })
      if (!employee || !role) return null
      const [department] = await this.app.model.Department.findOrCreate({ where: { name: payload.department }, defaults: { code: `DEPT_${Date.now()}`, status: 'enabled' }, transaction })
      await employee.update({ departmentId: department.id, name: payload.name, phone: payload.phone, status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction })
      await employee.setRoles([role], { transaction })
      await this.log('编辑员工', 'employee', employee.id, { account: employee.account }, transaction)
      return this.employeeJson(await this.app.model.Employee.findByPk(id, { include: [{ model: this.app.model.Department, as: 'department' }, { model: this.app.model.Role, as: 'roles', through: { attributes: [] } }], transaction }))
    })
    if (!result) return null

    // 员工资料、状态或角色变化后，撤销旧会话并失效授权缓存。
    await this.revokeEmployeeSessions(id)
    await this.invalidateAuthorization()
    return result
  }

  async updateEmployeeStatus(id, status) { const employee = await this.app.model.Employee.findByPk(id); if (!employee) return null; await employee.update({ status: status === 'disabled' ? 'disabled' : 'enabled' }); await this.log('更新账号状态', 'employee', id, { status: employee.status }); await this.revokeEmployeeSessions(id);await this.invalidateAuthorization();return this.employeeJson(await this.app.model.Employee.findByPk(id, { include: [{ model: this.app.model.Department, as: 'department' }, { model: this.app.model.Role, as: 'roles', through: { attributes: [] } }] })) }
  // 重置密码后撤销该员工全部会话，强制所有设备重新认证。
  async resetEmployeePassword(id) { const employee = await this.app.model.Employee.findByPk(id); if (!employee) return null; const temporaryPassword = 'Uniform@123'; await employee.update({ passwordHash: await bcrypt.hash(temporaryPassword, 12) }); await this.revokeEmployeeSessions(id); await this.log('重置密码', 'employee', id); return { temporaryPassword } }
  async deleteEmployee(id, currentUserId) { if (id === currentUserId) return { self: true };const result=await this.app.model.transaction(async (transaction) => { const employee = await this.app.model.Employee.findByPk(id, { transaction }); if (!employee) return null; await this.log('删除员工', 'employee', employee.id, { account: employee.account }, transaction); await employee.destroy({ transaction }); return { success: true } });if(result?.success){await this.ctx.service.cache.removeUserSessions(id);await this.invalidateAuthorization()}return result }

  async applyRolePermissions(role, payload, transaction) {
    // 角色编辑器只提交当前快捷菜单，后端自动补齐其父分组。
    const selectedMenuCodes = [
      ...new Set(
        (payload.menuPermissions || [])
          .filter((code) => editableMenuCodes.has(code)),
      ),
    ]
    const menuCodes = selectedMenuCodes.length
      ? ['shortcut_group', ...selectedMenuCodes]
      : []

    const menus = await this.app.model.Menu.findAll({ where: { code: menuCodes }, transaction })
    const operationCodes = (payload.operationPermissions || [])
      .filter((code) => editableOperationCodes.has(code))
    const permissions = await this.app.model.Permission.findAll({ where: { code: operationCodes }, transaction })
    await role.setMenus(menus, { transaction }); await role.setPermissions(permissions, { transaction })
  }

  async createRole(payload) {
    const result = await this.app.model.transaction(async (transaction) => { const role = await this.app.model.Role.create({ name: payload.name, code: payload.code, description: payload.description || '', dataScope: scopeValues[payload.dataScope] || 'self', status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction }); await this.applyRolePermissions(role, payload, transaction); await this.log('新增角色', 'role', role.id, { code: role.code }, transaction); return this.roleJson(await this.app.model.Role.findByPk(role.id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], transaction })) })
    // 角色创建成功后统一切换授权缓存版本。
    await this.invalidateAuthorization()
    return result
  }

  async updateRole(id, payload) {
    const result = await this.app.model.transaction(async (transaction) => { const role = await this.app.model.Role.findByPk(id, { transaction }); if (!role) return null; await role.update({ name: payload.name, description: payload.description || '', dataScope: scopeValues[payload.dataScope] || 'self', status: payload.status === 'disabled' ? 'disabled' : 'enabled' }, { transaction }); await this.applyRolePermissions(role, payload, transaction); await this.log('编辑角色', 'role', id, { code: role.code }, transaction); return this.roleJson(await this.app.model.Role.findByPk(id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }], transaction })) })
    if (!result) return null
    await this.invalidateAuthorization()
    return result
  }

  async updateRoleStatus(id, status) {
    const role = await this.app.model.Role.findByPk(id)
    if (!role) return null
    const employeeCount = await this.app.model.EmployeeRole.count({ where: { roleId: id } })
    if (status === 'disabled' && employeeCount) return { conflict: true }
    await role.update({ status: status === 'disabled' ? 'disabled' : 'enabled' })
    await this.log('更新角色状态', 'role', id, { status: role.status })
    const result = this.roleJson(await this.app.model.Role.findByPk(id, { include: [{ model: this.app.model.Menu, as: 'menus', through: { attributes: [] } }, { model: this.app.model.Permission, as: 'permissions', through: { attributes: [] } }] }))
    await this.invalidateAuthorization()
    return result
  }
  // 超级管理员角色受保护；存在关联员工的角色也不能删除。
  async deleteRole(id) {
    const result = await this.app.model.transaction(async (transaction) => { const role = await this.app.model.Role.findByPk(id, { transaction }); if (!role) return null; if (role.code === 'SUPER_ADMIN') return { protected: true }; const employeeCount = await this.app.model.EmployeeRole.count({ where: { roleId: id }, transaction }); if (employeeCount) return { conflict: true }; await this.log('删除角色', 'role', role.id, { code: role.code }, transaction); await role.destroy({ transaction }); return { success: true } })
    if (result?.success) await this.invalidateAuthorization()
    return result
  }
}

module.exports = SystemService
