/*
 * @Author: Chan
 * @Date: 2026-08-26 11:47:20
 * @LastEditors: chan
 * @LastEditTime: 2026-08-26 13:00:32
 * @FilePath: /school-uniform-platform/apps/api/config/config.local.js
 * @Description:
 *
 */
'use strict'

const path = require('node:path')
const dotenv = require('dotenv')

const appEnv =
  process.env.APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')

dotenv.config({
  path: path.resolve(__dirname, `../../../.env.${appEnv}`),
  override: false,
})

module.exports = (appInfo) => ({
  // 本地环境启用请求日志中间件，记录完整的请求和响应参数
  middleware: ['requestLogger', 'operationLogDetail'],

  // 配置 requestLogger 中间件选项
  requestLogger: {
    enable: true,
    // 应用到所有路由
    match: ['/.*/'],
  },

  // 日志级别设置为 INFO，便于查看请求日志
  logger: {
    level: 'INFO',
    consoleLevel: 'INFO',
  },

  // 安全中间件配置
  security: {
    csrf: {
      enable: false,
    },
  },
})
