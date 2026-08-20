'use strict'

/**
 * 生产批次，把生产订单拆分到具体产品、工厂、负责人和生产日期。
 */
module.exports = (app) => {
  const ProductionBatch = app.model.define('ProductionBatch', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    batchNo: { type: app.Sequelize.STRING, field: 'batch_no' },
    orderId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'order_id' },
    productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
    quantity: app.Sequelize.INTEGER.UNSIGNED,
    productionDate: { type: app.Sequelize.DATEONLY, field: 'production_date' },
    factoryId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'factory_id' },
    responsibleEmployeeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'responsible_employee_id' },
    status: app.Sequelize.STRING,
    notes: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_batches' })
  // 批次归属订单、产品、工厂和负责人，并包含生产记录及出库记录。
  ProductionBatch.associate = () => {
    ProductionBatch.belongsTo(app.model.ProductionOrder, { as: 'order', foreignKey: 'orderId' })
    ProductionBatch.belongsTo(app.model.Product, { as: 'product', foreignKey: 'productId' })
    ProductionBatch.belongsTo(app.model.ProductionFactory, { as: 'factory', foreignKey: 'factoryId' })
    ProductionBatch.belongsTo(app.model.Employee, { as: 'responsibleEmployee', foreignKey: 'responsibleEmployeeId' })
    ProductionBatch.hasMany(app.model.ProductionRecord, { as: 'records', foreignKey: 'batchId' })
    ProductionBatch.hasMany(app.model.ProductionOutbound, { as: 'outbounds', foreignKey: 'batchId' })
  }
  return ProductionBatch
}
