'use strict'

module.exports = (app) => {
  const Company = app.model.define('Company', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: app.Sequelize.STRING,
    name: app.Sequelize.STRING,
    brandName: { type: app.Sequelize.STRING, field: 'brand_name' },
    creditCode: { type: app.Sequelize.STRING, field: 'credit_code' },
    legalRepresentative: { type: app.Sequelize.STRING, field: 'legal_representative' },
    region: app.Sequelize.STRING,
    address: app.Sequelize.STRING,
    contactPhone: { type: app.Sequelize.STRING, field: 'contact_phone' },
    introduction: app.Sequelize.STRING(2000),
    logoFileId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'logo_file_id' },
    licenseFileId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'license_file_id' },
    status: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'companies' })

  Company.associate = () => {
    Company.hasMany(app.model.Product, { as: 'products', foreignKey: 'companyId' })
    Company.belongsTo(app.model.File, { as: 'licenseFile', foreignKey: 'licenseFileId' })
    Company.belongsTo(app.model.File, { as: 'logoFile', foreignKey: 'logoFileId' })
  }
  return Company
}
