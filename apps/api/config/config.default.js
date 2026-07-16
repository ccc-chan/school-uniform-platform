'use strict'

module.exports = (appInfo) => ({
  keys: `${appInfo.name}_school_uniform_digital_identity`,
  security: {
    csrf: {
      enable: false,
    },
  },
  cluster: {
    listen: {
      port: 7001,
    },
  },
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
      underscored: true,
      freezeTableName: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
})
