'use strict'

// Sequelize CLI 从仓库根目录加载与应用运行时相同的数据库环境变量。
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../../.env') })

// 三种 CLI 环境当前共用一套连接映射，具体数据库由环境变量区分。
const shared = {
  username: process.env.DB_USER || 'school_uniform',
  password: process.env.DB_PASSWORD || 'school_uniform_dev',
  database: process.env.DB_NAME || 'school_uniform',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  timezone: '+08:00',
  logging: false,
}

module.exports = { development: shared, test: shared, production: shared }
