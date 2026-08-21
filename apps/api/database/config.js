'use strict'

const path = require('node:path')
const dotenv = require('dotenv')

// 数据库命令与 API 使用相同的 APP_ENV 选择规则。
const appEnv =
  process.env.APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')

dotenv.config({
  path: path.resolve(__dirname, `../../../.env.${appEnv}`),
  override: false,
})

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

module.exports = {
  development: shared,
  test: shared,
  production: shared,
}
