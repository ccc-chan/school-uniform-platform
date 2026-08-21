'use strict'

const bcrypt = require('bcryptjs')

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [existingAdmins] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_employees WHERE account = 'admin' LIMIT 1",
        { transaction },
      )

      // 已初始化的历史环境不重复写入基础数据。
      if (existingAdmins.length) return

      const now = new Date()

      await queryInterface.bulkInsert(
        'sys_departments',
        [
          { id: 1, name: '品牌管理部', code: 'BRAND' },
          { id: 2, name: '数字化运营部', code: 'DIGITAL' },
          { id: 3, name: '生产管理部', code: 'PRODUCTION' },
          { id: 4, name: '质量管理部', code: 'QUALITY' },
        ].map((item) => ({
          ...item,
          parent_id: null,
          status: 'enabled',
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )

      await queryInterface.bulkInsert(
        'sys_roles',
        [
          {
            id: 1,
            name: '超级管理员',
            code: 'SUPER_ADMIN',
            description: '拥有平台全部管理权限',
            data_scope: 'all',
            status: 'enabled',
          },
          {
            id: 2,
            name: '二维码管理员',
            code: 'QR_ADMIN',
            description: '负责二维码生成、绑定、打印与查询',
            data_scope: 'department',
            status: 'enabled',
          },
          {
            id: 3,
            name: '生产管理员',
            code: 'PRODUCTION_ADMIN',
            description: '维护生产记录和生产流程',
            data_scope: 'department',
            status: 'enabled',
          },
          {
            id: 4,
            name: '质检专员',
            code: 'QUALITY_INSPECTOR',
            description: '负责检测报告上传及审核',
            data_scope: 'self',
            status: 'enabled',
          },
        ].map((item) => ({
          ...item,
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )

      const menus = [
        ['首页概览', 'dashboard', '/dashboard'],
        ['产品中心', 'products', '/products'],
        ['二维码中心', 'qrcodes', '/qrcodes'],
        ['生产中心', 'production', '/production'],
        ['检测中心', 'quality', '/quality'],
        ['品牌中心', 'brand', '/brand'],
        ['数据统计', 'analytics', '/analytics'],
        ['系统管理', 'system', '/system'],
      ]

      await queryInterface.bulkInsert(
        'sys_menus',
        menus.map(([name, code, path], index) => ({
          id: index + 1,
          name,
          code,
          path,
          parent_id: null,
          sort: index + 1,
          status: 'enabled',
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )

      const permissions = [
        ['查看', 'view'],
        ['新增', 'create'],
        ['编辑', 'edit'],
        ['删除', 'delete'],
        ['导出', 'export'],
        ['审核', 'audit'],
      ]

      await queryInterface.bulkInsert(
        'sys_permissions',
        permissions.map(([name, code], index) => ({
          id: index + 1,
          name,
          code,
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )

      await queryInterface.bulkInsert(
        'sys_employees',
        [
          {
            id: 1,
            department_id: 1,
            name: '系统管理员',
            phone: '13800000000',
            account: 'admin',
            password_hash: await bcrypt.hash('admin123', 12),
            status: 'enabled',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      )

      await queryInterface.bulkInsert(
        'sys_employee_roles',
        [{ employee_id: 1, role_id: 1, created_at: now }],
        { transaction },
      )

      const roleMenus = {
        1: [1, 2, 3, 4, 5, 6, 7, 8],
        2: [1, 3, 7],
        3: [1, 4],
        4: [1, 5],
      }

      await queryInterface.bulkInsert(
        'sys_role_menus',
        Object.entries(roleMenus).flatMap(([roleId, menuIds]) =>
          menuIds.map((menuId) => ({
            role_id: Number(roleId),
            menu_id: menuId,
            created_at: now,
          })),
        ),
        { transaction },
      )

      const rolePermissions = {
        1: [1, 2, 3, 4, 5, 6],
        2: [1, 2, 3, 5],
        3: [1, 2, 3],
        4: [1, 2, 6],
      }

      await queryInterface.bulkInsert(
        'sys_role_permissions',
        Object.entries(rolePermissions).flatMap(
          ([roleId, permissionIds]) =>
            permissionIds.map((permissionId) => ({
              role_id: Number(roleId),
              permission_id: permissionId,
              created_at: now,
            })),
        ),
        { transaction },
      )
    })
  },

  async down() {
    throw new Error('基础系统数据迁移不支持自动回滚')
  },
}
