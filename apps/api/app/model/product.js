'use strict'

/**
 * 校服产品档案；适用学校和尺码以 JSON 保存，imageId 指向产品图片元数据。
 */
module.exports = (app) => {
  const Product = app.model.define(
    'Product',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      code: app.Sequelize.STRING,
      name: app.Sequelize.STRING,
      category: app.Sequelize.STRING,
      qrCodeType: {
        type: app.Sequelize.STRING,
        field: 'qr_code_type',
      },
      season: app.Sequelize.STRING,
      schoolStage: {
        type: app.Sequelize.STRING,
        field: 'school_stage',
      },
      gender: app.Sequelize.STRING,
      price: app.Sequelize.DECIMAL(10, 2),
      status: app.Sequelize.STRING,
      description: app.Sequelize.STRING,
      applicableSchools: { type: app.Sequelize.JSON, field: 'applicable_schools' },
      style: app.Sequelize.STRING,
      color: app.Sequelize.STRING,
      sizes: app.Sequelize.JSON,
      fabricInfo: { type: app.Sequelize.TEXT, field: 'fabric_info' },
      executionStandard: { type: app.Sequelize.STRING, field: 'execution_standard' },
      washingInstructions: { type: app.Sequelize.TEXT, field: 'washing_instructions' },
      safetyCategory: { type: app.Sequelize.STRING, field: 'safety_category' },
      productionUnitName: { type: app.Sequelize.STRING, field: 'production_unit_name' },
      productionUnitCreditCode: { type: app.Sequelize.STRING, field: 'production_unit_credit_code' },
      productionUnitAddress: { type: app.Sequelize.STRING, field: 'production_unit_address' },
      productionUnitContact: { type: app.Sequelize.STRING, field: 'production_unit_contact' },
      productionUnitLicense: { type: app.Sequelize.TEXT, field: 'production_unit_license' },
      companyId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'company_id' },
      imageId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'image_id' },
      imageIds: { type: app.Sequelize.JSON, field: 'image_ids' },
      createdBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'created_by',
      },
    },
    { tableName: 'prd_products' },
  )
  Product.associate = () => {
    Product.belongsTo(app.model.Company, { as: 'company', foreignKey: 'companyId' })
    Product.belongsToMany(app.model.School, {
      as: 'schools',
      through: 'product_schools',
      foreignKey: 'product_id',
      otherKey: 'school_id',
      timestamps: true,
    })
  }
  return Product
}
