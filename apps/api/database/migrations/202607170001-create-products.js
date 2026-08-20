'use strict'

/**
 * 建立基础产品档案表及产品分类、状态和创建时间索引。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'prd_products',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        name: { type: Sequelize.STRING(100), allowNull: false },
        category: { type: Sequelize.STRING(30), allowNull: false },
        season: { type: Sequelize.STRING(20), allowNull: false },
        school_stage: { type: Sequelize.STRING(20), allowNull: false },
        price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: Sequelize.ENUM('enabled', 'disabled'),
          allowNull: false,
          defaultValue: 'enabled',
        },
        description: {
          type: Sequelize.STRING(500),
          allowNull: false,
          defaultValue: '',
        },
        created_by: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'sys_employees', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          ),
        },
      },
      { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' },
    )

    await queryInterface.addIndex('prd_products', ['category', 'status'])
    await queryInterface.addIndex('prd_products', ['created_at'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prd_products')
  },
}
