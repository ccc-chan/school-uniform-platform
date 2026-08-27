'use strict'

/**
 * 性能优化：为高频查询字段添加索引
 *
 * 优化目标：
 * 1. qr_codes.code - 唯一索引，加速二维码查询
 * 2. qr_codes.status - 状态过滤查询
 * 3. qr_codes.production_batch - 生产批次关联查询
 * 4. qr_scan_records.qr_code_id - 扫码记录关联查询
 * 5. operation_logs.created_at - 操作日志时间范围查询
 * 6. operation_logs.module - 模块过滤查询
 * 7. operation_logs.target_type, target_id - 目标对象查询
 * 8. products.code - 产品编号唯一索引（已在表创建时添加，此处确保）
 * 9. products.status - 产品状态过滤
 * 10. production_batches.product_id - 生产批次产品关联
 * 11. quality_reports.product_id - 质检报告产品关联
 * 12. quality_reports.status - 质检报告状态过滤
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('开始添加性能优化索引...')

    // 1. 二维码表索引优化
    console.log('添加 qr_codes 表索引...')

    // 二维码编号唯一索引（如果尚未存在）
    try {
      await queryInterface.addIndex('qr_codes', ['code'], {
        unique: true,
        name: 'idx_qr_codes_code_unique',
      })
    } catch (error) {
      console.log('索引 idx_qr_codes_code_unique 可能已存在:', error.message)
    }

    // 二维码状态索引
    try {
      await queryInterface.addIndex('qr_codes', ['status'], {
        name: 'idx_qr_codes_status',
      })
    } catch (error) {
      console.log('索引 idx_qr_codes_status 可能已存在:', error.message)
    }

    // 生产批次索引
    try {
      await queryInterface.addIndex('qr_codes', ['production_batch'], {
        name: 'idx_qr_codes_production_batch',
      })
    } catch (error) {
      console.log(
        '索引 idx_qr_codes_production_batch 可能已存在:',
        error.message,
      )
    }

    // 组合索引：状态 + 生产批次（优化常见查询）
    try {
      await queryInterface.addIndex(
        'qr_codes',
        ['status', 'production_batch'],
        {
          name: 'idx_qr_codes_status_batch',
        },
      )
    } catch (error) {
      console.log('索引 idx_qr_codes_status_batch 可能已存在:', error.message)
    }

    // 2. 扫码记录表索引优化
    console.log('添加 qr_scan_records 表索引...')

    // 二维码 ID 外键索引
    try {
      await queryInterface.addIndex('qr_scan_records', ['qr_code_id'], {
        name: 'idx_scan_records_qr_code_id',
      })
    } catch (error) {
      console.log('索引 idx_scan_records_qr_code_id 可能已存在:', error.message)
    }

    // 产品 ID + 扫描时间组合索引
    try {
      await queryInterface.addIndex(
        'qr_scan_records',
        ['product_id', 'scanned_at'],
        {
          name: 'idx_scan_records_product_scanned',
        },
      )
    } catch (error) {
      console.log(
        '索引 idx_scan_records_product_scanned 可能已存在:',
        error.message,
      )
    }

    // 3. 操作日志表索引优化
    console.log('添加 operation_logs 表索引...')

    // 创建时间索引
    try {
      await queryInterface.addIndex('operation_logs', ['created_at'], {
        name: 'idx_operation_logs_created_at',
      })
    } catch (error) {
      console.log(
        '索引 idx_operation_logs_created_at 可能已存在:',
        error.message,
      )
    }

    // 模块索引
    try {
      await queryInterface.addIndex('operation_logs', ['module'], {
        name: 'idx_operation_logs_module',
      })
    } catch (error) {
      console.log('索引 idx_operation_logs_module 可能已存在:', error.message)
    }

    // 目标类型 + 目标 ID 组合索引
    try {
      await queryInterface.addIndex(
        'operation_logs',
        ['target_type', 'target_id'],
        {
          name: 'idx_operation_logs_target',
        },
      )
    } catch (error) {
      console.log('索引 idx_operation_logs_target 可能已存在:', error.message)
    }

    // 员工 ID + 创建时间组合索引（优化员工操作查询）
    try {
      await queryInterface.addIndex(
        'operation_logs',
        ['employee_id', 'created_at'],
        {
          name: 'idx_operation_logs_employee_time',
        },
      )
    } catch (error) {
      console.log(
        '索引 idx_operation_logs_employee_time 可能已存在:',
        error.message,
      )
    }

    // 4. 产品表索引优化
    console.log('添加 prd_products 表索引...')

    // 产品编号唯一索引（确保存在）
    try {
      await queryInterface.addIndex('prd_products', ['code'], {
        unique: true,
        name: 'idx_products_code_unique',
      })
    } catch (error) {
      console.log('索引 idx_products_code_unique 可能已存在:', error.message)
    }

    // 产品状态索引
    try {
      await queryInterface.addIndex('prd_products', ['status'], {
        name: 'idx_products_status',
      })
    } catch (error) {
      console.log('索引 idx_products_status 可能已存在:', error.message)
    }

    // 产品分类 + 状态组合索引
    try {
      await queryInterface.addIndex('prd_products', ['category', 'status'], {
        name: 'idx_products_category_status',
      })
    } catch (error) {
      console.log(
        '索引 idx_products_category_status 可能已存在:',
        error.message,
      )
    }

    // 5. 生产批次表索引优化
    console.log('添加 production_batches 表索引...')

    // 产品 ID 索引
    try {
      await queryInterface.addIndex('production_batches', ['product_id'], {
        name: 'idx_production_batches_product_id',
      })
    } catch (error) {
      console.log(
        '索引 idx_production_batches_product_id 可能已存在:',
        error.message,
      )
    }

    // 批次编号唯一索引
    try {
      await queryInterface.addIndex('production_batches', ['batch_no'], {
        unique: true,
        name: 'idx_production_batches_batch_no_unique',
      })
    } catch (error) {
      console.log(
        '索引 idx_production_batches_batch_no_unique 可能已存在:',
        error.message,
      )
    }

    // 生产状态索引
    try {
      await queryInterface.addIndex('production_batches', ['status'], {
        name: 'idx_production_batches_status',
      })
    } catch (error) {
      console.log(
        '索引 idx_production_batches_status 可能已存在:',
        error.message,
      )
    }

    // 6. 质检报告表索引优化
    console.log('添加 quality_reports 表索引...')

    // 产品 ID 索引
    try {
      await queryInterface.addIndex('quality_reports', ['product_id'], {
        name: 'idx_quality_reports_product_id',
      })
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_product_id 可能已存在:',
        error.message,
      )
    }

    // 报告状态索引
    try {
      await queryInterface.addIndex('quality_reports', ['status'], {
        name: 'idx_quality_reports_status',
      })
    } catch (error) {
      console.log('索引 idx_quality_reports_status 可能已存在:', error.message)
    }

    // 报告编号唯一索引
    try {
      await queryInterface.addIndex('quality_reports', ['report_no'], {
        unique: true,
        name: 'idx_quality_reports_report_no_unique',
      })
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_report_no_unique 可能已存在:',
        error.message,
      )
    }

    // 创建时间 + 状态组合索引
    try {
      await queryInterface.addIndex(
        'quality_reports',
        ['created_at', 'status'],
        {
          name: 'idx_quality_reports_time_status',
        },
      )
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_time_status 可能已存在:',
        error.message,
      )
    }

    console.log('所有性能优化索引添加完成！')
  },

  async down(queryInterface) {
    console.log('开始回滚性能优化索引...')

    // 删除 qr_scan_records 表索引（先删除可能受外键约束的索引）
    try {
      await queryInterface.removeIndex(
        'qr_scan_records',
        'idx_scan_records_product_scanned',
      )
    } catch (error) {
      console.log(
        '索引 idx_scan_records_product_scanned 删除失败:',
        error.message,
      )
    }

    // 删除 qr_codes 表索引
    try {
      await queryInterface.removeIndex('qr_codes', 'idx_qr_codes_code_unique')
    } catch (error) {
      console.log('索引 idx_qr_codes_code_unique 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex('qr_codes', 'idx_qr_codes_status')
    } catch (error) {
      console.log('索引 idx_qr_codes_status 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex(
        'qr_codes',
        'idx_qr_codes_production_batch',
      )
    } catch (error) {
      console.log('索引 idx_qr_codes_production_batch 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex('qr_codes', 'idx_qr_codes_status_batch')
    } catch (error) {
      console.log('索引 idx_qr_codes_status_batch 删除失败:', error.message)
    }

    // 注意：idx_scan_records_qr_code_id 可能因外键约束无法删除，跳过

    // 删除 sys_operation_logs 表索引
    try {
      await queryInterface.removeIndex(
        'sys_operation_logs',
        'idx_operation_logs_module',
      )
    } catch (error) {
      console.log('索引 idx_operation_logs_module 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex(
        'sys_operation_logs',
        'idx_operation_logs_target',
      )
    } catch (error) {
      console.log('索引 idx_operation_logs_target 删除失败:', error.message)
    }

    // 删除 prd_products 表索引
    try {
      await queryInterface.removeIndex(
        'prd_products',
        'idx_products_code_unique',
      )
    } catch (error) {
      console.log('索引 idx_products_code_unique 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex('prd_products', 'idx_products_status')
    } catch (error) {
      console.log('索引 idx_products_status 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex(
        'prd_products',
        'idx_products_category_status',
      )
    } catch (error) {
      console.log('索引 idx_products_category_status 删除失败:', error.message)
    }

    // 删除 production_batches 表索引
    try {
      await queryInterface.removeIndex(
        'production_batches',
        'idx_production_batches_product_id',
      )
    } catch (error) {
      console.log(
        '索引 idx_production_batches_product_id 删除失败:',
        error.message,
      )
    }

    try {
      await queryInterface.removeIndex(
        'production_batches',
        'idx_production_batches_batch_no_unique',
      )
    } catch (error) {
      console.log(
        '索引 idx_production_batches_batch_no_unique 删除失败:',
        error.message,
      )
    }

    try {
      await queryInterface.removeIndex(
        'production_batches',
        'idx_production_batches_status',
      )
    } catch (error) {
      console.log('索引 idx_production_batches_status 删除失败:', error.message)
    }

    // 删除 quality_reports 表索引
    try {
      await queryInterface.removeIndex(
        'quality_reports',
        'idx_quality_reports_product_id',
      )
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_product_id 删除失败:',
        error.message,
      )
    }

    try {
      await queryInterface.removeIndex(
        'quality_reports',
        'idx_quality_reports_status',
      )
    } catch (error) {
      console.log('索引 idx_quality_reports_status 删除失败:', error.message)
    }

    try {
      await queryInterface.removeIndex(
        'quality_reports',
        'idx_quality_reports_report_no_unique',
      )
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_report_no_unique 删除失败:',
        error.message,
      )
    }

    try {
      await queryInterface.removeIndex(
        'quality_reports',
        'idx_quality_reports_time_status',
      )
    } catch (error) {
      console.log(
        '索引 idx_quality_reports_time_status 删除失败:',
        error.message,
      )
    }

    console.log('性能优化索引回滚完成！')
  },
}
