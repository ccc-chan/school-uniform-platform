'use strict'

const menuCode = 'shortcut_system'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date()
      const [groupRows] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_menus WHERE code = 'shortcut_group' LIMIT 1",
        { transaction },
      )
      const shortcutGroupId = Number(groupRows[0]?.id)

      if (!shortcutGroupId) {
        throw new Error('新菜单分组 shortcut_group 不存在')
      }

      await queryInterface.bulkInsert(
        'sys_menus',
        [
          {
            name: '系统管理',
            code: menuCode,
            path: null,
            parent_id: shortcutGroupId,
            sort: 60,
            status: 'enabled',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      )

      const [menuRows] = await queryInterface.sequelize.query(
        'SELECT id FROM sys_menus WHERE code = :menuCode LIMIT 1',
        {
          replacements: { menuCode },
          transaction,
        },
      )
      const shortcutSystemId = Number(menuRows[0]?.id)

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :shortcutGroupId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code = 'system'`,
        {
          replacements: {
            shortcutGroupId,
            createdAt: now,
          },
          transaction,
        },
      )

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :shortcutSystemId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code = 'system'`,
        {
          replacements: {
            shortcutSystemId,
            createdAt: now,
          },
          transaction,
        },
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [menuRows] = await queryInterface.sequelize.query(
        'SELECT id FROM sys_menus WHERE code = :menuCode',
        {
          replacements: { menuCode },
          transaction,
        },
      )
      const menuIds = menuRows.map((row) => Number(row.id))

      if (menuIds.length) {
        await queryInterface.bulkDelete(
          'sys_role_menus',
          { menu_id: menuIds },
          { transaction },
        )
      }

      await queryInterface.bulkDelete(
        'sys_menus',
        { code: menuCode },
        { transaction },
      )
    })
  },
}
