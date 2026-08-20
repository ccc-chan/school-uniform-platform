'use strict'

/**
 * 单个二维码身份记录，保存生成批次、绑定产品、生产批次及状态流转信息。
 */
module.exports = (app) => {
  const QrCode = app.model.define(
    'QrCode',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      generationBatchId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'generation_batch_id',
      },
      code: app.Sequelize.STRING,
      status: app.Sequelize.STRING,
      productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
      productSku: { type: app.Sequelize.STRING, field: 'product_sku' },
      productionBatch: {
        type: app.Sequelize.STRING,
        field: 'production_batch',
      },
      boundBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'bound_by' },
      boundAt: { type: app.Sequelize.DATE, field: 'bound_at' },
      createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
    },
    { tableName: 'qr_codes' },
  )

  // 二维码归属于一个生成批次，绑定后可进一步关联具体产品。
  QrCode.associate = () => {
    QrCode.belongsTo(app.model.QrGenerationBatch, {
      as: 'generationBatch',
      foreignKey: 'generationBatchId',
    })
    QrCode.belongsTo(app.model.Product, {
      as: 'product',
      foreignKey: 'productId',
    })
  }

  return QrCode
}
