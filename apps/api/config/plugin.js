'use strict'

// Sequelize 负责 MySQL 持久化数据访问。
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
}

// Redis 负责跨进程共享的会话、验证码、权限缓存和限流数据。
exports.redis = {
  enable: true,
  package: 'egg-redis',
}
