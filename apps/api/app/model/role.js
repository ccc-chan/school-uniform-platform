'use strict'
module.exports = (app) => {
  const Role = app.model.define('Role', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, name: app.Sequelize.STRING, code: app.Sequelize.STRING, description: app.Sequelize.STRING, dataScope: { type: app.Sequelize.STRING, field: 'data_scope' }, status: app.Sequelize.STRING }, { tableName: 'sys_roles' })
  Role.associate = () => { Role.belongsToMany(app.model.Employee, { as: 'employees', through: app.model.EmployeeRole, foreignKey: 'roleId', otherKey: 'employeeId' }); Role.belongsToMany(app.model.Menu, { as: 'menus', through: app.model.RoleMenu, foreignKey: 'roleId', otherKey: 'menuId' }); Role.belongsToMany(app.model.Permission, { as: 'permissions', through: app.model.RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' }) }
  return Role
}
