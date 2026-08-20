'use strict'

module.exports = (app) =>
  app.model.define(
    'OperationLog',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'employee_id',
      },
      module: app.Sequelize.STRING,
      action: app.Sequelize.STRING,
      targetType: {
        type: app.Sequelize.STRING,
        field: 'target_type',
      },
      targetId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'target_id',
      },
      detail: app.Sequelize.JSON,
      ip: app.Sequelize.STRING,
    },
    { tableName: 'sys_operation_logs', updatedAt: false },
  )
