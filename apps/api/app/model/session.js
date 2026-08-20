'use strict'
// 登录会话记录；令牌仅在 expiresAt 之前有效，并归属于一个员工。
module.exports = (app) => {
  const Session = app.model.define('Session', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, employeeId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'employee_id' }, token: app.Sequelize.STRING, expiresAt: { type: app.Sequelize.DATE, field: 'expires_at' } }, { tableName: 'sys_sessions', updatedAt: false })
  // 认证中间件通过该关联一次取得会话对应的员工及角色信息。
  Session.associate = () => Session.belongsTo(app.model.Employee, { as: 'employee', foreignKey: 'employeeId' })
  return Session
}
