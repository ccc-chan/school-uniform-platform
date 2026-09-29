'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET execution_standard = '0'
    `)
    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET safety_category = CASE
        WHEN safety_category LIKE 'GB 18401-2010%' THEN '0'
        WHEN safety_category LIKE 'GB 31701-2015%' THEN '1'
        ELSE ''
      END
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE prd_products
      SET execution_standard = CASE
        WHEN execution_standard = '0' THEN 'GBT 31888-2015《中小学生校服》'
        ELSE execution_standard
      END,
      safety_category = CASE safety_category
        WHEN '0' THEN 'GB 18401-2010《国家纺织产品基本安全技术规范》B类'
        WHEN '1' THEN 'GB 31701-2015《婴幼儿及儿童纺织产品安全技术规范》B类'
        ELSE safety_category
      END
    `)
  },
}
