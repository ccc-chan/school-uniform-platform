'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'code', {
      type: Sequelize.STRING(32),
      allowNull: true,
    })

    await queryInterface.sequelize.query(`
      UPDATE companies
      SET code = CONCAT('COMPANY', LPAD(id, 6, '0'))
      WHERE code IS NULL OR code = ''
    `)

    await queryInterface.changeColumn('companies', 'code', {
      type: Sequelize.STRING(32),
      allowNull: false,
    })
    await queryInterface.addIndex('companies', ['code'], {
      unique: true,
      name: 'companies_code_unique',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('companies', 'companies_code_unique')
    await queryInterface.removeColumn('companies', 'code')
  },
}
