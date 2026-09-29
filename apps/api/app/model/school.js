'use strict'

module.exports = (app) => {
  const School = app.model.define('School', {
    id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: app.Sequelize.STRING(10), field: 'school_code' },
    name: app.Sequelize.STRING(160),
    schoolType: { type: app.Sequelize.STRING(50), field: 'school_type' },
    address: app.Sequelize.STRING(255),
    contactPhone: { type: app.Sequelize.STRING(50), field: 'contact_phone' },
    organizer: app.Sequelize.STRING(100),
    status: app.Sequelize.ENUM('enabled', 'disabled'),
    sourceUpdatedAt: { type: app.Sequelize.DATEONLY, field: 'source_updated_at' },
  }, { tableName: 'schools' })

  School.associate = () => {
    School.belongsToMany(app.model.Product, {
      as: 'products',
      through: 'product_schools',
      foreignKey: 'school_id',
      otherKey: 'product_id',
      timestamps: true,
    })
  }
  return School
}
