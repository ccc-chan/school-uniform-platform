'use strict'

/**
 * 生产工序定义；同一流程通过 nodeOrder 排序，consumerVisible 控制消费者可见性。
 */
module.exports = (app) => {
  const ProductionProcess = app.model.define('ProductionProcess', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    flowName: { type: app.Sequelize.STRING, field: 'flow_name' },
    nodeName: { type: app.Sequelize.STRING, field: 'node_name' },
    nodeOrder: { type: app.Sequelize.INTEGER.UNSIGNED, field: 'node_order' },
    description: app.Sequelize.STRING,
    consumerVisible: { type: app.Sequelize.BOOLEAN, field: 'consumer_visible' },
    status: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_processes' })
  // 一个工序定义可以被多个实际生产记录引用。
  ProductionProcess.associate = () => {
    ProductionProcess.hasMany(app.model.ProductionRecord, { as: 'records', foreignKey: 'processId' })
  }
  return ProductionProcess
}
