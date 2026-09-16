/*
 * @Author: Chan
 * @Date: 2026-09-16 10:03:31
 * @LastEditors: chan
 * @LastEditTime: 2026-09-16 10:03:32
 * @FilePath: /school-uniform-platform/apps/api/database/migrations/202609160001-add-product-production-unit-fields.js
 * @Description: 
 * 
 */
'use strict'

/**
 * 为产品增加生产单位公开信息字段，支持后台录入与前台公开展示。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'production_unit_name', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    })
    await queryInterface.addColumn(
      'prd_products',
      'production_unit_credit_code',
      {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
    )
    await queryInterface.addColumn('prd_products', 'production_unit_address', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    })
    await queryInterface.addColumn('prd_products', 'production_unit_contact', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    })
    await queryInterface.addColumn('prd_products', 'production_unit_license', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    })
  },

  async down(queryInterface) {
    for (const column of [
      'production_unit_license',
      'production_unit_contact',
      'production_unit_address',
      'production_unit_credit_code',
      'production_unit_name',
    ]) {
      await queryInterface.removeColumn('prd_products', column)
    }
  },
}
