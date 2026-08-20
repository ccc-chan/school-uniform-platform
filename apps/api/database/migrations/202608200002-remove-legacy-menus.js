'use strict'

const legacyMenuCodes = [
  'legacy_group',
  'dashboard',
  'products',
  'qrcodes',
  'production',
  'quality',
  'brand',
  'analytics',
  'system',
]

const legacyMenus = [
  ['dashboard', '首页概览', '/dashboard', 10],
  ['products', '产品中心', '/products', 20],
  ['qrcodes', '二维码中心', '/qrcodes', 30],
  ['production', '生产中心', '/production', 40],
  ['quality', '检测中心', '/quality', 50],
  ['brand', '品牌中心', '/brand', 60],
  ['analytics', '数据统计', '/analytics', 70],
  ['system', '系统管理', '/system', 80],
]

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id FROM sys_menus WHERE code IN (:legacyMenuCodes)',
        {
          replacements: { legacyMenuCodes },
          transaction,
        },
      )
      const menuIds = rows.map((row) => Number(row.id))

      if (menuIds.length) {
        await queryInterface.bulkDelete(
          'sys_role_menus',
          { menu_id: menuIds },
          { transaction },
        )
        await queryInterface.bulkDelete(
          'sys_menus',
          { id: menuIds },
          { transaction },
        )
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date()

      await queryInterface.bulkInsert(
        'sys_menus',
        [
          {
            name: '旧菜单',
            code: 'legacy_group',
            path: null,
            parent_id: null,
            sort: 10,
            status: 'disabled',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      )

      const [groups] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_menus WHERE code = 'legacy_group' LIMIT 1",
        { transaction },
      )
      const parentId = Number(groups[0]?.id)

      await queryInterface.bulkInsert(
        'sys_menus',
        legacyMenus.map(([code, name, path, sort]) => ({
          name,
          code,
          path,
          parent_id: parentId,
          sort,
          status: 'enabled',
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )
    })
  },
}
