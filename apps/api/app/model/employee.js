'use strict'
module.exports = (app) => {
  const Employee = app.model.define('Employee', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, departmentId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'department_id' }, name: app.Sequelize.STRING, phone: app.Sequelize.STRING, account: app.Sequelize.STRING, passwordHash: { type: app.Sequelize.STRING, field: 'password_hash' }, status: app.Sequelize.STRING, lastLoginAt: { type: app.Sequelize.DATE, field: 'last_login_at' } }, { tableName: 'sys_employees' })
  Employee.associate = () => { Employee.belongsTo(app.model.Department, { as: 'department', foreignKey: 'departmentId' }); Employee.belongsToMany(app.model.Role, { as: 'roles', through: app.model.EmployeeRole, foreignKey: 'employeeId', otherKey: 'roleId' }) }
  return Employee
}
