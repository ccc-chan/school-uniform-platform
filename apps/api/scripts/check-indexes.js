#!/usr/bin/env node
/**
 * 检查数据库索引是否已正确创建
 * 运行方式：node scripts/check-indexes.js
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
    logging: false,
  }
)

async function checkIndexes() {
  console.log('🔍 开始检查数据库索引...\n')

  const tables = [
    { name: 'qr_codes', expected: ['idx_qr_codes_code_unique', 'idx_qr_codes_status', 'idx_qr_codes_production_batch', 'idx_qr_codes_status_batch'] },
    { name: 'qr_scan_records', expected: ['idx_scan_records_qr_code_id', 'idx_scan_records_product_scanned'] },
    { name: 'sys_operation_logs', expected: ['idx_operation_logs_module', 'idx_operation_logs_target'] },
    { name: 'prd_products', expected: ['idx_products_code_unique', 'idx_products_status', 'idx_products_category_status'] },
    { name: 'production_batches', expected: ['idx_production_batches_product_id', 'idx_production_batches_batch_no_unique', 'idx_production_batches_status'] },
    { name: 'quality_reports', expected: ['idx_quality_reports_product_id', 'idx_quality_reports_status', 'idx_quality_reports_report_no_unique', 'idx_quality_reports_time_status'] },
  ]

  let totalExpected = 0
  let totalFound = 0

  for (const { name, expected } of tables) {
    console.log(`📋 检查表：${name}`)
    totalExpected += expected.length

    try {
      const indexes = await sequelize.query(
        `SHOW INDEX FROM \`${name}\``,
        { type: sequelize.QueryTypes.SELECT }
      )

      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))]
      const found = expected.filter(name => indexNames.includes(name))
      const missing = expected.filter(name => !indexNames.includes(name))

      totalFound += found.length

      if (found.length > 0) {
        console.log(`  ✅ 已找到 ${found.length} 个索引:`)
        found.forEach(name => console.log(`     - ${name}`))
      }

      if (missing.length > 0) {
        console.log(`  ⚠️  缺失 ${missing.length} 个索引:`)
        missing.forEach(name => console.log(`     - ${name}`))
      }

      console.log()
    } catch (error) {
      console.log(`  ❌ 检查失败: ${error.message}\n`)
    }
  }

  console.log('📊 总结:')
  console.log(`   预期索引总数：${totalExpected}`)
  console.log(`   已找到索引数：${totalFound}`)
  console.log(`   缺失索引数：${totalExpected - totalFound}`)

  if (totalFound === totalExpected) {
    console.log('\n✅ 所有索引已成功创建！')
  } else {
    console.log('\n⚠️  部分索引缺失，请检查迁移日志')
  }

  await sequelize.close()
  process.exit(totalFound === totalExpected ? 0 : 1)
}

checkIndexes().catch(error => {
  console.error('❌ 检查过程中发生错误:', error)
  process.exit(1)
})
