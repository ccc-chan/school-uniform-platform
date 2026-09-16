'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'safety_category', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('prd_products', 'safety_category')
  },
}
