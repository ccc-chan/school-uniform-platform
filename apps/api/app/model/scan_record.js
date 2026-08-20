'use strict'

/**
 * 消费者扫码事件，保存匿名访客标识、地区、设备类型和扫码时间。
 */
module.exports = (app) => {
  const ScanRecord = app.model.define(
    'ScanRecord',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      qrCodeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'qr_code_id' },
      productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
      visitorHash: { type: app.Sequelize.STRING, field: 'visitor_hash' },
      province: app.Sequelize.STRING,
      city: app.Sequelize.STRING,
      deviceType: { type: app.Sequelize.STRING, field: 'device_type' },
      scannedAt: { type: app.Sequelize.DATE, field: 'scanned_at' },
    },
    { tableName: 'qr_scan_records' },
  )

  // 扫码事件关联被扫描的二维码及其对应产品。
  ScanRecord.associate = () => {
    ScanRecord.belongsTo(app.model.QrCode, {
      as: 'qrCode',
      foreignKey: 'qrCodeId',
    })
    ScanRecord.belongsTo(app.model.Product, {
      as: 'product',
      foreignKey: 'productId',
    })
  }

  return ScanRecord
}
