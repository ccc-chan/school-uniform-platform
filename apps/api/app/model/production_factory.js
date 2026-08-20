'use strict'

// 生产工厂资料，记录联系方式、地址、日产能及启停状态。
module.exports = (app) => {
  const ProductionFactory = app.model.define('ProductionFactory', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: app.Sequelize.STRING,
    name: app.Sequelize.STRING,
    contactName: { type: app.Sequelize.STRING, field: 'contact_name' },
    contactPhone: { type: app.Sequelize.STRING, field: 'contact_phone' },
    address: app.Sequelize.STRING,
    dailyCapacity: { type: app.Sequelize.INTEGER.UNSIGNED, field: 'daily_capacity' },
    status: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_factories' })
  // 一个工厂可以承担多个生产批次。
  ProductionFactory.associate = () => {
    ProductionFactory.hasMany(app.model.ProductionBatch, { as: 'batches', foreignKey: 'factoryId' })
  }
  return ProductionFactory
}
