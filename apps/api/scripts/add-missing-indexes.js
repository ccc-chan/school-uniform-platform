#!/usr/bin/env node
/**
 * 手动添加缺失的索引
 * 运行方式：node scripts/add-missing-indexes.js
 */

const { Sequelize } = require('sequelize')
const dotenv = require('dotenv')
const path = require('path')

// 加载环境变量
const appEnv = process.env.APP_ENV || 'dev'
dotenv.config({
  path: path.resolve(__dirname, `../../.env.${appEnv}`),
})

const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_uniform',
  process.env.DB_USER || 'school_uniform',
  process.env.DB_PASSWORD || 'school_uniform_dev',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: console.log,
  }
)

async function addMissingIndexes() {
  console.log('🔧 开始添加缺失的索引...\n')

  const indexesToAdd = [
    // qr_codes 表索引
    {
      table: 'qr_codes',
      sql: 'CREATE UNIQUE INDEX idx_qr_codes_code_unique ON qr_codes(code)',
      name: 'idx_qr_codes_code_unique',
    },
    {
      table: 'qr_codes',
      sql: 'CREATE INDEX idx_qr_codes_status ON qr_codes(status)',
      name: 'idx_qr_codes_status',
    },
    {
      table: 'qr_codes',
      sql: 'CREATE INDEX idx_qr_codes_production_batch ON qr_codes(production_batch)',
      name: 'idx_qr_codes_production_batch',
    },
    {
      table: 'qr_codes',
      sql: 'CREATE INDEX idx_qr_codes_status_batch ON qr_codes(status, production_batch)',
      name: 'idx_qr_codes_status_batch',
    },
    // sys_operation_logs 表索引
    {
      table: 'sys_operation_logs',
      sql: 'CREATE INDEX idx_operation_logs_module ON sys_operation_logs(module)',
      name: 'idx_operation_logs_module',
    },
    {
      table: 'sys_operation_logs',
      sql: 'CREATE INDEX idx_operation_logs_target ON sys_operation_logs(target_type, target_id)',
      name: 'idx_operation_logs_target',
    },
  ]

  for (const { table, sql, name } of indexesToAdd) {
    console.log(`\n尝试添加索引 ${name} 到表 ${table}...`)
    try {
      await sequelize.query(sql)
      console.log(`✅ 索引 ${name} 添加成功！`)
    } catch (error) {
      if (error.original && error.original.errno === 1061) {
        console.log(`⚠️  索引 ${name} 已存在，跳过`)
      } else {
        console.log(`❌ 索引 ${name} 添加失败:`, error.message)
      }
    }
  }

  console.log('\n✅ 索引添加完成！')
  await sequelize.close()
}

addMissingIndexes().catch(error => {
  console.error('❌ 添加索引过程中发生错误:', error)
  process.exit(1)
})
