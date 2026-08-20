'use strict'
/**
 * 角色是员工、菜单和操作权限之间的授权载体，并包含数据范围设置。
 */
module.exports = (app) => {
  const Role = app.model.define('Role', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, name: app.Sequelize.STRING, code: app.Sequelize.STRING, description: app.Sequelize.STRING, dataScope: { type: app.Sequelize.STRING, field: 'data_scope' }, status: app.Sequelize.STRING }, { tableName: 'sys_roles' })
  // 角色分别通过三张关联表连接员工、菜单和细粒度权限。
  Role.associate = () => { Role.belongsToMany(app.model.Employee, { as: 'employees', through: app.model.EmployeeRole, foreignKey: 'roleId', otherKey: 'employeeId' }); Role.belongsToMany(app.model.Menu, { as: 'menus', through: app.model.RoleMenu, foreignKey: 'roleId', otherKey: 'menuId' }); Role.belongsToMany(app.model.Permission, { as: 'permissions', through: app.model.RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' }) }
  return Role
}
