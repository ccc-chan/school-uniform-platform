'use strict'

module.exports = (appInfo) => ({
  // 统一补充操作日志上下文，便于审计业务请求。
  middleware: ['operationLogDetail'],

  // Egg 使用 keys 签名 Cookie 等框架数据。
  keys: `${appInfo.name}_school_uniform_digital_identity`,

  security: {
    csrf: {
      // 当前管理端使用令牌认证；若以后改为 Cookie 会话，需要重新启用 CSRF。
      enable: false,
    },
  },

  // API 服务默认监听端口。
  cluster: {
    listen: {
      port: 7001,
    },
  },

  // 上传采用临时文件模式，视频和报告文件允许较大的体积。
  multipart: {
    mode: 'file',
    fileSize: '200mb',
    fileExtensions: ['.pdf', '.mp4', '.webm', '.mov'],
  },

  // Redis 属于认证链路的关键依赖，连接失败时阻止服务带病启动。
  redis: {
    client: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password:
        process.env.REDIS_PASSWORD || 'school_uniform_redis_dev',
      db: Number(process.env.REDIS_DB || 0),
    },
  },

  // 数据库连接信息优先读取环境变量，本地开发使用后备值。
  sequelize: {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'school_uniform',
    username: process.env.DB_USER || 'school_uniform',
    password: process.env.DB_PASSWORD || 'school_uniform_dev',
    timezone: '+08:00',
    logging: false,
    define: {
      // 模型字段映射为 snake_case，并直接使用模型声明的表名。
      underscored: true,
      freezeTableName: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
})
