'use strict'

const table = 'production_batches'
const reportConstraint = 'fk_production_batches_quality_report_file_id'
const reportIndex = 'idx_production_batches_quality_report_file_id'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(table, 'execution_standard', {
        type: Sequelize.STRING(160),
        allowNull: true,
      }, { transaction })
      await queryInterface.addColumn(table, 'safety_category', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }, { transaction })
      await queryInterface.addColumn(table, 'fabric_components', {
        type: Sequelize.JSON,
        allowNull: true,
      }, { transaction })
      await queryInterface.addColumn(table, 'fabric_ratio', {
        type: Sequelize.STRING(60),
        allowNull: true,
      }, { transaction })
      await queryInterface.addColumn(table, 'quality_report_file_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      }, { transaction })
      await queryInterface.addConstraint(table, {
        fields: ['quality_report_file_id'],
        type: 'foreign key',
        name: reportConstraint,
        references: { table: 'sys_files', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        transaction,
      })
      await queryInterface.addIndex(table, ['quality_report_file_id'], {
        name: reportIndex,
        transaction,
      })
    })
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(table, reportIndex, { transaction })
      await queryInterface.removeConstraint(table, reportConstraint, { transaction })
      await queryInterface.removeColumn(table, 'quality_report_file_id', { transaction })
      await queryInterface.removeColumn(table, 'fabric_ratio', { transaction })
      await queryInterface.removeColumn(table, 'fabric_components', { transaction })
      await queryInterface.removeColumn(table, 'safety_category', { transaction })
      await queryInterface.removeColumn(table, 'execution_standard', { transaction })
    })
  },
}
