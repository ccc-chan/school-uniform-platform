'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qr_student_bindings', {
      qr_code_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        references: { model: 'qr_codes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      school_name: { type: Sequelize.STRING(100), allowNull: false },
      class_name: { type: Sequelize.STRING(100), allowNull: false },
      student_name: { type: Sequelize.STRING(100), allowNull: false },
      parent_name: { type: Sequelize.STRING(100), allowNull: false },
      phone: { type: Sequelize.STRING(11), allowNull: false },
      version: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' })
    await queryInterface.addIndex('qr_student_bindings', ['school_name'])
    await queryInterface.addIndex('qr_student_bindings', ['phone'])

    await queryInterface.sequelize.transaction(async (transaction) => {
      const [groups] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_menus WHERE code = 'shortcut_group'",
        { transaction },
      )
      if (!groups[0]) throw new Error('缺少 shortcut_group 菜单分组')
      const now = new Date()
      await queryInterface.bulkInsert('sys_menus', [{
        code: 'shortcut_qr_management', name: '二维码管理',
        path: '/qrcodes/list', parent_id: groups[0].id, sort: 25,
        status: 'enabled', created_at: now, updated_at: now,
      }], { transaction })
      await queryInterface.sequelize.query(
        `INSERT IGNORE INTO sys_role_menus (role_id, menu_id, created_at)
         SELECT rm.role_id, target.id, :now
         FROM sys_role_menus rm
         JOIN sys_menus source ON source.id = rm.menu_id
         JOIN sys_menus target ON target.code = 'shortcut_qr_management'
         WHERE source.code = 'shortcut_products'`,
        { replacements: { now }, transaction },
      )
    })
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE rm FROM sys_role_menus rm
         JOIN sys_menus m ON m.id = rm.menu_id
         WHERE m.code = 'shortcut_qr_management'`, { transaction },
      )
      await queryInterface.bulkDelete('sys_menus', { code: 'shortcut_qr_management' }, { transaction })
    })
    await queryInterface.dropTable('qr_student_bindings')
  },
}
