'use strict'

const bcrypt = require('bcryptjs')

module.exports = {
  async up(queryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert('sys_departments', [
      { id: 1, name: '品牌管理部', code: 'BRAND', status: 'enabled', created_at: now, updated_at: now },
      { id: 2, name: '数字化运营部', code: 'DIGITAL', status: 'enabled', created_at: now, updated_at: now },
      { id: 3, name: '生产管理部', code: 'PRODUCTION', status: 'enabled', created_at: now, updated_at: now },
      { id: 4, name: '质量管理部', code: 'QUALITY', status: 'enabled', created_at: now, updated_at: now },
    ])
    await queryInterface.bulkInsert('sys_roles', [
      { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有平台全部管理权限', data_scope: 'all', status: 'enabled', created_at: now, updated_at: now },
      { id: 2, name: '二维码管理员', code: 'QR_ADMIN', description: '负责二维码生成、绑定、打印与查询', data_scope: 'department', status: 'enabled', created_at: now, updated_at: now },
      { id: 3, name: '生产管理员', code: 'PRODUCTION_ADMIN', description: '维护生产记录和生产流程', data_scope: 'department', status: 'enabled', created_at: now, updated_at: now },
      { id: 4, name: '质检专员', code: 'QUALITY_INSPECTOR', description: '负责检测报告上传及审核', data_scope: 'self', status: 'disabled', created_at: now, updated_at: now },
    ])
    const menus = [['首页概览', 'dashboard', '/dashboard'], ['产品中心', 'products', '/products'], ['二维码中心', 'qrcodes', '/qrcodes'], ['生产中心', 'production', '/production'], ['检测中心', 'quality', '/quality'], ['品牌中心', 'brand', '/brand'], ['数据统计', 'analytics', '/analytics'], ['系统管理', 'system', '/system']]
    await queryInterface.bulkInsert('sys_menus', menus.map(([name, code, path], index) => ({ id: index + 1, name, code, path, sort: index + 1, status: 'enabled', created_at: now, updated_at: now })))
    const permissions = [['查看', 'view'], ['新增', 'create'], ['编辑', 'edit'], ['删除', 'delete'], ['导出', 'export'], ['审核', 'audit']]
    await queryInterface.bulkInsert('sys_permissions', permissions.map(([name, code], index) => ({ id: index + 1, name, code, created_at: now, updated_at: now })))
    const passwordHash = await bcrypt.hash('admin123', 12)
    const employees = [['张三', '13800005678', 'admin', 1, 'enabled'], ['李四', '13900002046', 'lisi', 2, 'enabled'], ['王五', '13700008912', 'wangwu', 3, 'enabled'], ['赵六', '13600004477', 'zhaoliu', 4, 'disabled'], ['孙七', '13500006633', 'sunqi', 2, 'enabled'], ['周八', '13300001859', 'zhouba', 3, 'enabled']]
    await queryInterface.bulkInsert('sys_employees', employees.map(([name, phone, account, departmentId, status], index) => ({ id: index + 1, department_id: departmentId, name, phone, account, password_hash: passwordHash, status, created_at: now, updated_at: now })))
    await queryInterface.bulkInsert('sys_employee_roles', [1, 2, 3, 4, 2, 3].map((roleId, index) => ({ employee_id: index + 1, role_id: roleId, created_at: now })))
    const roleMenus = { 1: [1, 2, 3, 4, 5, 6, 7, 8], 2: [1, 3, 7], 3: [1, 4], 4: [1, 5] }
    await queryInterface.bulkInsert('sys_role_menus', Object.entries(roleMenus).flatMap(([roleId, ids]) => ids.map((menuId) => ({ role_id: Number(roleId), menu_id: menuId, created_at: now }))))
    const rolePermissions = { 1: [1, 2, 3, 4, 5, 6], 2: [1, 2, 3, 5], 3: [1, 2, 3], 4: [1, 2, 6] }
    await queryInterface.bulkInsert('sys_role_permissions', Object.entries(rolePermissions).flatMap(([roleId, ids]) => ids.map((permissionId) => ({ role_id: Number(roleId), permission_id: permissionId, created_at: now }))))
  },

  async down(queryInterface) {
    for (const table of ['sys_role_permissions', 'sys_role_menus', 'sys_employee_roles', 'sys_employees', 'sys_permissions', 'sys_menus', 'sys_roles', 'sys_departments']) await queryInterface.bulkDelete(table, null, {})
  },
}
