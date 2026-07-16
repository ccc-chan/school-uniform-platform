'use strict'
module.exports = (app) => {
  const Session = app.model.define('Session', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, employeeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'employee_id' }, token: app.Sequelize.STRING, expiresAt: { type: app.Sequelize.DATE, field: 'expires_at' } }, { tableName: 'sys_sessions', updatedAt: false })
  Session.associate = () => Session.belongsTo(app.model.Employee, { as: 'employee', foreignKey: 'employeeId' })
  return Session
}
