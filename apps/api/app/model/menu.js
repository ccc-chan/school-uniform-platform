'use strict'
module.exports = (app) => app.model.define('Menu', { id: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true }, name: app.Sequelize.STRING, code: app.Sequelize.STRING, path: app.Sequelize.STRING, status: app.Sequelize.STRING }, { tableName: 'sys_menus' })
