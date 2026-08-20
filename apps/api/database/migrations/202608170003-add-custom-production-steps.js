'use strict'

/**
 * 允许产品详情为生产批次追加自定义环节，同时保留原有标准工序记录。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('production_records', 'content', {
      type: Sequelize.STRING(200),
      allowNull: true,
      after: 'process_id',
    })

    await queryInterface.sequelize.query(
      `UPDATE production_records records
       JOIN production_processes processes ON processes.id = records.process_id
       SET records.content = processes.node_name
       WHERE records.content IS NULL`,
    )

    await queryInterface.sequelize.query(
      'ALTER TABLE production_records MODIFY process_id BIGINT UNSIGNED NULL',
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('production_records', {
      process_id: null,
    })

    await queryInterface.sequelize.query(
      'ALTER TABLE production_records MODIFY process_id BIGINT UNSIGNED NOT NULL',
    )

    await queryInterface.removeColumn('production_records', 'content')
  },
}
