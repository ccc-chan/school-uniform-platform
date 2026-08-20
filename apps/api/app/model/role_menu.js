'use strict'

module.exports = (app) =>
  app.model.define(
    'RoleMenu',
    {
      roleId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        field: 'role_id',
      },
      menuId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        field: 'menu_id',
      },
    },
    { tableName: 'sys_role_menus', updatedAt: false },
  )
