'use strict'

module.exports = (app) =>
  app.model.define(
    'Department',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: app.Sequelize.STRING,
      code: app.Sequelize.STRING,
      status: app.Sequelize.STRING,
    },
    { tableName: 'sys_departments' },
  )
