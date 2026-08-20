'use strict'

/**
 * 生产订单记录客户、产品、计划数量、交付日期和订单状态。
 */
module.exports = (app) => {
  const ProductionOrder = app.model.define('ProductionOrder', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    orderNo: { type: app.Sequelize.STRING, field: 'order_no' },
    customerName: { type: app.Sequelize.STRING, field: 'customer_name' },
    productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
    quantity: app.Sequelize.INTEGER.UNSIGNED,
    deliveryDate: { type: app.Sequelize.DATEONLY, field: 'delivery_date' },
    status: app.Sequelize.STRING,
    notes: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'production_orders' })
  // 订单属于一个产品，并可拆分为多个生产批次。
  ProductionOrder.associate = () => {
    ProductionOrder.belongsTo(app.model.Product, { as: 'product', foreignKey: 'productId' })
    ProductionOrder.hasMany(app.model.ProductionBatch, { as: 'batches', foreignKey: 'orderId' })
  }
  return ProductionOrder
}
