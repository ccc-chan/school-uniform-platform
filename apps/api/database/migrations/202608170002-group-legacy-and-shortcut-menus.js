'use strict'

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

const shortcutMenus = [
  ['shortcut_dashboard', '仪表盘', '/dashboard', 'dashboard', 10],
  ['shortcut_products', '产品管理', '/products', 'products', 20],
  [
    'shortcut_label_print',
    '标签打印',
    '/qrcodes/label-print',
    'qrcodes',
    30,
  ],
  [
    'shortcut_employees',
    '员工管理',
    '/system/employees',
    'system',
    40,
  ],
  [
    'shortcut_company_settings',
    '公司设置',
    '/brand/profile',
    'brand',
    50,
  ],
]

const internalMenuCodes = [
  'legacy_group',
  'shortcut_group',
  ...shortcutMenus.map(([code]) => code),
]

const previousMenus = [
  ['dashboard', '仪表盘', '/dashboard', 10, 'enabled'],
  ['products', '产品管理', '/products', 20, 'enabled'],
  ['qrcodes', '标签打印', '/qrcodes/label-print', 30, 'enabled'],
  ['production', '生产中心', '/production', 4, 'disabled'],
  ['quality', '检测中心', '/quality', 5, 'disabled'],
  ['brand', '公司设置', '/brand/profile', 50, 'enabled'],
  ['analytics', '数据统计', '/analytics', 7, 'disabled'],
  ['system', '员工管理', '/system/employees', 40, 'enabled'],
]

module.exports = {
  async up(queryInterface) {
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
            status: 'enabled',
            created_at: now,
            updated_at: now,
          },
          {
            name: '新菜单',
            code: 'shortcut_group',
            path: null,
            parent_id: null,
            sort: 20,
            status: 'enabled',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      )

      const [groupRows] = await queryInterface.sequelize.query(
        "SELECT id, code FROM sys_menus WHERE code IN ('legacy_group', 'shortcut_group')",
        { transaction },
      )
      const groupIds = new Map(
        groupRows.map((row) => [row.code, Number(row.id)]),
      )
      const legacyGroupId = groupIds.get('legacy_group')
      const shortcutGroupId = groupIds.get('shortcut_group')

      for (const [code, name, path, sort] of legacyMenus) {
        await queryInterface.bulkUpdate(
          'sys_menus',
          {
            name,
            path,
            parent_id: legacyGroupId,
            sort,
            status: 'enabled',
            updated_at: now,
          },
          { code },
          { transaction },
        )
      }

      await queryInterface.bulkInsert(
        'sys_menus',
        shortcutMenus.map(([code, name, path, , sort]) => ({
          name,
          code,
          path,
          parent_id: shortcutGroupId,
          sort,
          status: 'enabled',
          created_at: now,
          updated_at: now,
        })),
        { transaction },
      )

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :legacyGroupId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code IN ('dashboard', 'products', 'qrcodes', 'production', 'quality', 'brand', 'analytics', 'system')`,
        {
          replacements: { legacyGroupId, createdAt: now },
          transaction,
        },
      )

      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT DISTINCT rm.role_id, :shortcutGroupId, :createdAt
         FROM sys_role_menus rm
         JOIN sys_menus menu ON menu.id = rm.menu_id
         WHERE menu.code IN ('dashboard', 'products', 'qrcodes', 'system', 'brand')`,
        {
          replacements: { shortcutGroupId, createdAt: now },
          transaction,
        },
      )

      const [shortcutRows] = await queryInterface.sequelize.query(
        `SELECT id, code
         FROM sys_menus
         WHERE code IN ('shortcut_dashboard', 'shortcut_products', 'shortcut_label_print', 'shortcut_employees', 'shortcut_company_settings')`,
        { transaction },
      )
      const shortcutIds = new Map(
        shortcutRows.map((row) => [row.code, Number(row.id)]),
      )

      for (const [shortcutCode, , , sourceCode] of shortcutMenus) {
        await queryInterface.sequelize.query(
          `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
           SELECT DISTINCT rm.role_id, :shortcutMenuId, :createdAt
           FROM sys_role_menus rm
           JOIN sys_menus menu ON menu.id = rm.menu_id
           WHERE menu.code = :sourceCode`,
          {
            replacements: {
              shortcutMenuId: shortcutIds.get(shortcutCode),
              createdAt: now,
              sourceCode,
            },
            transaction,
          },
        )
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date()

      for (const [code, name, path, sort, status] of previousMenus) {
        await queryInterface.bulkUpdate(
          'sys_menus',
          {
            name,
            path,
            parent_id: null,
            sort,
            status,
            updated_at: now,
          },
          { code },
          { transaction },
        )
      }

      const [internalRows] = await queryInterface.sequelize.query(
        `SELECT id FROM sys_menus
         WHERE code IN ('legacy_group', 'shortcut_group', 'shortcut_dashboard', 'shortcut_products', 'shortcut_label_print', 'shortcut_employees', 'shortcut_company_settings')`,
        { transaction },
      )
      const internalMenuIds = internalRows.map((row) => Number(row.id))

      if (internalMenuIds.length) {
        await queryInterface.bulkDelete(
          'sys_role_menus',
          { menu_id: internalMenuIds },
          { transaction },
        )
      }

      await queryInterface.bulkDelete(
        'sys_menus',
        { code: internalMenuCodes },
        { transaction },
      )
    })
  },
}
