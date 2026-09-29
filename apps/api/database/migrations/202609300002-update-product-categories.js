'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET category = CASE category
        WHEN 'sports_set' THEN 'set'
        WHEN 'formal_set' THEN 'set'
        WHEN 'outerwear' THEN 'single_outerwear'
        WHEN 'single_item' THEN 'single_top'
        ELSE category
      END
      WHERE category IN (
        'sports_set',
        'formal_set',
        'outerwear',
        'single_item'
      )
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET category = CASE category
        WHEN 'set' THEN 'sports_set'
        WHEN 'single_outerwear' THEN 'outerwear'
        WHEN 'single_top' THEN 'single_item'
        ELSE category
      END
      WHERE category IN ('set', 'single_outerwear', 'single_top')
    `)
  },
}
