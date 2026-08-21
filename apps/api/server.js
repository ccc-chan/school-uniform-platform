'use strict'

const { startCluster } = require('egg')

// 生产环境以前台进程运行，便于 Docker 正确管理退出信号和自动重启。
startCluster({
  baseDir: __dirname,
  port: Number(process.env.PORT || 7001),
  workers: Number(process.env.API_WORKERS || 1),
  title: 'school-uniform-api',
})
