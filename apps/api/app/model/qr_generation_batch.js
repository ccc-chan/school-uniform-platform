'use strict'

/**
 * 二维码生成任务批次，记录生成模式、产品、数量和编号前缀。
 */
module.exports = (app) => {
  const QrGenerationBatch = app.model.define(
    'QrGenerationBatch',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      batchNo: { type: app.Sequelize.STRING, field: 'batch_no' },
      mode: app.Sequelize.STRING,
      productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
      quantity: app.Sequelize.INTEGER.UNSIGNED,
      prefix: app.Sequelize.STRING,
      notes: app.Sequelize.STRING,
      createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
    },
    { tableName: 'qr_generation_batches' },
  )

  // 生成批次属于一个产品，并包含该次生成的全部二维码。
  QrGenerationBatch.associate = () => {
    QrGenerationBatch.belongsTo(app.model.Product, {
      as: 'product',
      foreignKey: 'productId',
    })
    QrGenerationBatch.hasMany(app.model.QrCode, {
      as: 'codes',
      foreignKey: 'generationBatchId',
    })
  }

  return QrGenerationBatch
}
