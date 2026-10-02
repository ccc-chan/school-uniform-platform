'use strict'

/**
 * 生产批次，把生产订单拆分到具体产品、负责人和生产日期。
 */
module.exports = (app) => {
  const ProductionBatch = app.model.define('ProductionBatch', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    batchNo: { type: app.Sequelize.STRING, field: 'batch_no' },
    orderId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'order_id' },
    orderNo: { type: app.Sequelize.STRING(120), field: 'order_no' },
    productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
    quantity: app.Sequelize.INTEGER.UNSIGNED,
    productionDate: { type: app.Sequelize.DATEONLY, field: 'production_date' },
    executionStandard: { type: app.Sequelize.STRING(160), field: 'execution_standard' },
    safetyCategory: { type: app.Sequelize.STRING(255), field: 'safety_category' },
    fabricComponents: { type: app.Sequelize.JSON, field: 'fabric_components' },
    fabricRatio: { type: app.Sequelize.STRING(60), field: 'fabric_ratio' },
    qualityReportFileId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'quality_report_file_id' },
    factoryName: { type: app.Sequelize.STRING(120), field: 'factory_name' },
    responsibleEmployeeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'responsible_employee_id' },
    responsibleEmployeeName: {
      type: app.Sequelize.STRING(80),
      field: 'responsible_employee_name',
    },
    status: app.Sequelize.STRING,
    notes: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_batches' })
  // 批次归属订单、产品和负责人，并包含生产记录及出库记录。
  ProductionBatch.associate = () => {
    ProductionBatch.belongsTo(app.model.ProductionOrder, { as: 'order', foreignKey: 'orderId' })
    ProductionBatch.belongsTo(app.model.Product, { as: 'product', foreignKey: 'productId' })
    ProductionBatch.belongsTo(app.model.Employee, { as: 'responsibleEmployee', foreignKey: 'responsibleEmployeeId' })
    ProductionBatch.belongsTo(app.model.File, { as: 'qualityReportFile', foreignKey: 'qualityReportFileId' })
    ProductionBatch.hasMany(app.model.ProductionRecord, { as: 'records', foreignKey: 'batchId' })
    ProductionBatch.hasMany(app.model.ProductionOutbound, { as: 'outbounds', foreignKey: 'batchId' })
  }
  return ProductionBatch
}
