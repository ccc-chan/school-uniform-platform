'use strict'
module.exports = (app) => app.model.define('EmployeeRole', { employeeId: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, field: 'employee_id' }, roleId: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, field: 'role_id' } }, { tableName: 'sys_employee_roles', updatedAt: false })
