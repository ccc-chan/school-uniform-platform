'use strict'

module.exports = (app) =>
  app.model.define(
    'Menu',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: app.Sequelize.STRING,
      code: app.Sequelize.STRING,
      path: app.Sequelize.STRING,
      parentId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'parent_id',
      },
      sort: app.Sequelize.INTEGER.UNSIGNED,
      status: app.Sequelize.STRING,
    },
    { tableName: 'sys_menus' },
  )
