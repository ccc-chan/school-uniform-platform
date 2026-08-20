'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'qr_code_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'product',
    })
    await queryInterface.addIndex(
      'prd_products',
      ['qr_code_type', 'status'],
      { name: 'prd_products_qr_code_type_status' },
    )
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'prd_products',
      'prd_products_qr_code_type_status',
    )
    await queryInterface.removeColumn('prd_products', 'qr_code_type')
  },
}
