'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'gender', {
      type: Sequelize.STRING(20),
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('prd_products', 'gender')
  },
}
