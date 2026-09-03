'use strict'

/**
 * 为产品详情中的生产环节补充现场操作人和照片字段。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('production_records', 'operator_name', {
      type: Sequelize.STRING(80),
      allowNull: true,
      after: 'content',
    })

    await queryInterface.addColumn('production_records', 'photo_file_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'sys_files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'operator_name',
    })

    await queryInterface.addIndex('production_records', ['photo_file_id'])
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'production_records',
      ['photo_file_id'],
    )
    await queryInterface.removeColumn(
      'production_records',
      'photo_file_id',
    )
    await queryInterface.removeColumn(
      'production_records',
      'operator_name',
    )
  },
}
