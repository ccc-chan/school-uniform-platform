'use strict'

/**
 * 实际生产执行记录，描述某员工在某批次和工序中完成的数量与时间。
 */
module.exports = (app) => {
  const ProductionRecord = app.model.define('ProductionRecord', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    batchId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'batch_id' },
    employeeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'employee_id' },
    processId: {
      type: app.Sequelize.BIGINT.UNSIGNED,
      field: 'process_id',
      allowNull: true,
    },
    content: { type: app.Sequelize.STRING(200), allowNull: true },
    quantity: app.Sequelize.INTEGER.UNSIGNED,
    startedAt: { type: app.Sequelize.DATE, field: 'started_at' },
    completedAt: { type: app.Sequelize.DATE, field: 'completed_at' },
    status: app.Sequelize.STRING,
    notes: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_records' })
  // 执行记录同时关联生产批次、执行员工和工序定义。
  ProductionRecord.associate = () => {
    ProductionRecord.belongsTo(app.model.ProductionBatch, { as: 'batch', foreignKey: 'batchId' })
    ProductionRecord.belongsTo(app.model.Employee, { as: 'employee', foreignKey: 'employeeId' })
    ProductionRecord.belongsTo(app.model.ProductionProcess, { as: 'process', foreignKey: 'processId' })
  }
  return ProductionRecord
}
