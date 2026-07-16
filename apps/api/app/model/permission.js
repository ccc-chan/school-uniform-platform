'use strict'
module.exports = (app) => app.model.define('Permission', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, name: app.Sequelize.STRING, code: app.Sequelize.STRING }, { tableName: 'sys_permissions' })
