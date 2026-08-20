'use strict'

const businessMenuCodes = [
  'dashboard',
  'products',
  'qrcodes',
  'production',
  'quality',
  'brand',
  'analytics',
  'system',
]

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date()
      const [menuRows] = await queryInterface.sequelize.query(
        `SELECT id, code
         FROM sys_menus
         WHERE code IN ('legacy_group', 'shortcut_employees')`,
        { transaction },
      )
      const menuIds = new Map(
        menuRows.map((row) => [row.code, Number(row.id)]),
      )
      const legacyGroupId = menuIds.get('legacy_group')
      const shortcutEmployeesId = menuIds.get('shortcut_employees')

      if (legacyGroupId) {
        await queryInterface.bulkDelete(
          'sys_role_menus',
          { menu_id: legacyGroupId },
          { transaction },
        )
        await queryInterface.bulkUpdate(
          'sys_menus',
          {
            status: 'disabled',
            updated_at: now,
          },
          { id: legacyGroupId },
          { transaction },
        )
      }

      if (shortcutEmployeesId) {
        await queryInterface.bulkDelete(
          'sys_role_menus',
          { menu_id: shortcutEmployeesId },
          { transaction },
        )
        await queryInterface.bulkDelete(
          'sys_menus',
          { id: shortcutEmployeesId },
          { transaction },
        )
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date()
      const [groupRows] = await queryInterface.sequelize.query(
        `SELECT id, code
         FROM sys_menus
         WHERE code IN ('legacy_group', 'shortcut_group')`,
        { transaction },
      )
      const groupIds = new Map(
        groupRows.map((row) => [row.code, Number(row.id)]),
      )
      const legacyGroupId = groupIds.get('legacy_group')
      const shortcutGroupId = groupIds.get('shortcut_group')

      if (!legacyGroupId || !shortcutGroupId) {
        throw new Error('菜单分组数据不完整')
      }

      await queryInterface.bulkUpdate(
        'sys_menus',
        {
          status: 'enabled',
          updated_at: now,
        },
        { id: legacyGroupId },
        { transaction },
      )

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :legacyGroupId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code IN (:businessMenuCodes)`,
        {
          replacements: {
            legacyGroupId,
            createdAt: now,
            businessMenuCodes,
          },
          transaction,
        },
      )

      await queryInterface.bulkInsert(
        'sys_menus',
        [
          {
            name: '员工管理',
            code: 'shortcut_employees',
            path: '/system/employees',
            parent_id: shortcutGroupId,
            sort: 40,
            status: 'enabled',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      )

      const [shortcutRows] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_menus WHERE code = 'shortcut_employees' LIMIT 1",
        { transaction },
      )
      const shortcutEmployeesId = Number(shortcutRows[0]?.id)

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :shortcutEmployeesId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code = 'system'`,
        {
          replacements: {
            shortcutEmployeesId,
            createdAt: now,
          },
          transaction,
        },
      )
    })
  },
}
