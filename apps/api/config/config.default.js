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
  // 统一补充操作日志上下文，便于审计业务请求。
  middleware: ['operationLogDetail'],

  // 生产环境从环境变量读取独立签名密钥。
  keys:
    process.env.APP_KEYS ||
    `${appInfo.name}_school_uniform_digital_identity`,

  // API 只通过内部 Docker 网络接受 Nginx 请求，可以信任代理转发的客户端 IP。
  proxy: ['test', 'prod'].includes(process.env.APP_ENV),

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

  // 本地和测试环境通过 MinIO 保存上传文件。
  storage: {
    driver: process.env.STORAGE_DRIVER || 'minio',
    endpoint: process.env.STORAGE_ENDPOINT || '127.0.0.1',
    port: Number(process.env.STORAGE_PORT || 9000),
    useSSL: process.env.STORAGE_USE_SSL === 'true',
    bucket: process.env.STORAGE_BUCKET || 'school-uniform-dev',
    accessKey: process.env.STORAGE_ACCESS_KEY || 'school_uniform',
    secretKey:
      process.env.STORAGE_SECRET_KEY || 'school_uniform_minio_dev',
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
