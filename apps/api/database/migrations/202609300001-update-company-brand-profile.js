'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('companies', 'english_name', 'brand_name')
    await queryInterface.addColumn('companies', 'logo_file_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'sys_files', key: 'id' },
      onDelete: 'SET NULL',
    })
    await queryInterface.addColumn('companies', 'introduction', {
      type: Sequelize.STRING(2000),
      allowNull: false,
      defaultValue: '',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('companies', 'introduction')
    await queryInterface.removeColumn('companies', 'logo_file_id')
    await queryInterface.renameColumn('companies', 'brand_name', 'english_name')
  },
}
