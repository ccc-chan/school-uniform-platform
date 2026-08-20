/*
 * @Author: Chan
 * @Date: 2026-07-16 09:57:28
 * @LastEditors: chan
 * @LastEditTime: 2026-08-06 11:42:31
 * @FilePath: /school-uniform-platform/apps/api/app/model/employee.js
 * @Description: 
 * 
 */
'use strict'
/**
 * 员工登录账号，保存部门归属、密码摘要、账号状态和最近登录时间。
 */
module.exports = (app) => {
  const Employee = app.model.define(
    'Employee',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      departmentId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'department_id',
      },
      name: app.Sequelize.STRING,
      phone: app.Sequelize.STRING,
      account: app.Sequelize.STRING,
      passwordHash: { type: app.Sequelize.STRING, field: 'password_hash' },
      status: app.Sequelize.STRING,
      lastLoginAt: { type: app.Sequelize.DATE, field: 'last_login_at' },
    },
    { tableName: 'sys_employees' },
  )
  // 员工属于一个部门，并通过中间表拥有一个或多个角色。
  Employee.associate = () => {
    Employee.belongsTo(app.model.Department, {
      as: 'department',
      foreignKey: 'departmentId',
    })
    Employee.belongsToMany(app.model.Role, {
      as: 'roles',
      through: app.model.EmployeeRole,
      foreignKey: 'employeeId',
      otherKey: 'roleId',
    })
  }
  return Employee
}
