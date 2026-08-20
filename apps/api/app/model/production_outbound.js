'use strict'

/**
 * 产品出库记录，保存生产批次、数量、收货信息和经办员工。
 */
module.exports = (app) => {
  const ProductionOutbound = app.model.define('ProductionOutbound', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    outboundNo: { type: app.Sequelize.STRING, field: 'outbound_no' },
    batchId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'batch_id' },
    quantity: app.Sequelize.INTEGER.UNSIGNED,
    outboundDate: { type: app.Sequelize.DATEONLY, field: 'outbound_date' },
    recipient: app.Sequelize.STRING,
    destination: app.Sequelize.STRING,
    handledBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'handled_by' },
    status: app.Sequelize.STRING,
    notes: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_outbounds' })
  // 出库记录归属于生产批次，并关联具体经办员工。
  ProductionOutbound.associate = () => {
    ProductionOutbound.belongsTo(app.model.ProductionBatch, { as: 'batch', foreignKey: 'batchId' })
    ProductionOutbound.belongsTo(app.model.Employee, { as: 'handler', foreignKey: 'handledBy' })
  }
  return ProductionOutbound
}
