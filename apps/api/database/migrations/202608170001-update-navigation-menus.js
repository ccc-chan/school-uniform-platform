'use strict'

const enabledMenus = [
  ['dashboard', '仪表盘', '/dashboard', 10],
  ['products', '产品管理', '/products', 20],
  ['qrcodes', '标签打印', '/qrcodes/label-print', 30],
  ['system', '员工管理', '/system/employees', 40],
  ['brand', '公司设置', '/brand/profile', 50],
]

const disabledMenuCodes = ['production', 'quality', 'analytics']

const originalMenus = [
  ['dashboard', '首页概览', '/dashboard', 1],
  ['products', '产品中心', '/products', 2],
  ['qrcodes', '二维码中心', '/qrcodes', 3],
  ['production', '生产中心', '/production', 4],
  ['quality', '检测中心', '/quality', 5],
  ['brand', '品牌中心', '/brand', 6],
  ['analytics', '数据统计', '/analytics', 7],
  ['system', '系统管理', '/system', 8],
]

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const updatedAt = new Date()

      for (const [code, name, path, sort] of enabledMenus) {
        await queryInterface.bulkUpdate(
          'sys_menus',
          {
            name,
            path,
            parent_id: null,
            sort,
            status: 'enabled',
            updated_at: updatedAt,
          },
          { code },
          { transaction },
        )
      }

      await queryInterface.bulkUpdate(
        'sys_menus',
        {
          status: 'disabled',
          updated_at: updatedAt,
        },
        { code: disabledMenuCodes },
        { transaction },
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const updatedAt = new Date()

      for (const [code, name, path, sort] of originalMenus) {
        await queryInterface.bulkUpdate(
          'sys_menus',
          {
            name,
            path,
            parent_id: null,
            sort,
            status: 'enabled',
            updated_at: updatedAt,
          },
          { code },
          { transaction },
        )
      }
    })
  },
}
