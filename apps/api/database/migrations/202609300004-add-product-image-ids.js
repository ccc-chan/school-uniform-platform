'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'image_ids', {
      type: Sequelize.JSON,
      allowNull: true,
    })

    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET image_ids = JSON_ARRAY(image_id)
      WHERE image_id IS NOT NULL
    `)
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('prd_products', 'image_ids')
  },
}
