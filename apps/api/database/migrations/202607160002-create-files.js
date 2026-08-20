'use strict'

/**
 * 建立通用文件元数据表；物理文件由应用保存在 storage/uploads。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'sys_files',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        original_name: { type: Sequelize.STRING(255), allowNull: false },
        stored_name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        mime_type: { type: Sequelize.STRING(100), allowNull: false },
        category: { type: Sequelize.STRING(20), allowNull: false },
        size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
        uploaded_by: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'sys_employees', key: 'id' },
          onDelete: 'SET NULL',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' },
    )
    // 文件分类和创建时间组合索引用于文件管理列表筛选与排序。
    await queryInterface.addIndex('sys_files', ['category', 'created_at'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sys_files')
  },
}
