'use strict'

// 数据分析模块当前使用单一页面访问权限。
const permissions = [
  ['查看数据统计', 'analytics.view'],
]

/**
 * 建立消费者扫码事件表及分析索引，并注册数据分析访问权限。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'qr_scan_records',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        qr_code_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'qr_codes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        product_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'prd_products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        visitor_hash: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        province: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: '',
        },
        city: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: '',
        },
        device_type: {
          type: Sequelize.ENUM('mobile', 'tablet', 'desktop', 'other'),
          allowNull: false,
          defaultValue: 'other',
        },
        scanned_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          ),
        },
      },
      { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' },
    )

    // 按主要分析维度建立组合索引，支持时间、产品、地区和访客统计。
    await queryInterface.addIndex('qr_scan_records', ['scanned_at'])
    await queryInterface.addIndex('qr_scan_records', ['product_id', 'scanned_at'])
    await queryInterface.addIndex('qr_scan_records', ['province', 'city', 'scanned_at'])
    await queryInterface.addIndex('qr_scan_records', ['visitor_hash', 'scanned_at'])

    const now = new Date()
    await queryInterface.bulkInsert(
      'sys_permissions',
      permissions.map(([name, code]) => ({
        name,
        code,
        created_at: now,
        updated_at: now,
      })),
    )

    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_roles WHERE code = 'SUPER_ADMIN'",
    )
    const [permissionRows] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_permissions WHERE code = 'analytics.view'",
    )
    if (roles.length && permissionRows.length) {
      await queryInterface.bulkInsert(
        'sys_role_permissions',
        roles.flatMap((role) => permissionRows.map((permission) => ({
          role_id: role.id,
          permission_id: permission.id,
          created_at: now,
        }))),
      )
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code = 'analytics.view'",
    )
    await queryInterface.bulkDelete(
      'sys_permissions',
      { code: permissions.map(([, code]) => code) },
    )
    await queryInterface.dropTable('qr_scan_records')
  },
}
