'use strict'

module.exports = (app) => {
  const Company = app.model.define('Company', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: app.Sequelize.STRING,
    englishName: { type: app.Sequelize.STRING, field: 'english_name' },
    creditCode: { type: app.Sequelize.STRING, field: 'credit_code' },
    legalRepresentative: { type: app.Sequelize.STRING, field: 'legal_representative' },
    industry: app.Sequelize.STRING,
    region: app.Sequelize.STRING,
    address: app.Sequelize.STRING,
    contactPhone: { type: app.Sequelize.STRING, field: 'contact_phone' },
    licenseFileId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'license_file_id' },
    status: app.Sequelize.STRING,
    createdBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'created_by' },
  }, { tableName: 'companies' })

  Company.associate = () => {
    Company.hasMany(app.model.Product, { as: 'products', foreignKey: 'companyId' })
    Company.belongsTo(app.model.File, { as: 'licenseFile', foreignKey: 'licenseFileId' })
  }
  return Company
}
