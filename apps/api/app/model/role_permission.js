'use strict'

module.exports = (app) =>
  app.model.define(
    'RolePermission',
    {
      roleId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        field: 'role_id',
      },
      permissionId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        field: 'permission_id',
      },
    },
    { tableName: 'sys_role_permissions', updatedAt: false },
  )
