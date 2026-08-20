'use strict'

// 二维码模块同时定义页面操作权限和响应字段权限。
const permissions = [
  ['查看二维码数据', 'qrcode.view'],
  ['生成二维码', 'qrcode.generate'],
  ['批量生成二维码', 'qrcode.batch_generate'],
  ['绑定二维码', 'qrcode.bind'],
  ['查看二维码编号字段', 'qrcode.field.code'],
  ['查看绑定产品字段', 'qrcode.field.product'],
  ['查看二维码状态字段', 'qrcode.field.status'],
  ['查看二维码创建时间字段', 'qrcode.field.created_at'],
]

const timestamps = (Sequelize) => ({
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
})

/**
 * 建立二维码生成批次和二维码明细表，并注册二维码模块权限。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'qr_generation_batches',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        batch_no: {
          type: Sequelize.STRING(40),
          allowNull: false,
          unique: true,
        },
        mode: {
          type: Sequelize.ENUM('single', 'batch'),
          allowNull: false,
        },
        product_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'prd_products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        quantity: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        prefix: { type: Sequelize.STRING(12), allowNull: false },
        notes: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
        created_by: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'sys_employees', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        ...timestamps(Sequelize),
      },
      { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' },
    )

    await queryInterface.createTable(
      'qr_codes',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        generation_batch_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'qr_generation_batches', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        code: {
          type: Sequelize.STRING(40),
          allowNull: false,
          unique: true,
        },
        status: {
          type: Sequelize.ENUM('unbound', 'bound', 'activated', 'voided'),
          allowNull: false,
          defaultValue: 'unbound',
        },
        product_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'prd_products', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        product_sku: { type: Sequelize.STRING(100), allowNull: true },
        production_batch: { type: Sequelize.STRING(100), allowNull: true },
        bound_by: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'sys_employees', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        bound_at: { type: Sequelize.DATE, allowNull: true },
        created_by: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'sys_employees', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        ...timestamps(Sequelize),
      },
      { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' },
    )

    await queryInterface.addIndex('qr_generation_batches', ['product_id', 'created_at'])
    await queryInterface.addIndex('qr_codes', ['generation_batch_id', 'status'])
    await queryInterface.addIndex('qr_codes', ['product_id', 'status'])
    await queryInterface.addIndex('qr_codes', ['production_batch'])
    await queryInterface.addIndex('qr_codes', ['created_at'])

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
      "SELECT id FROM sys_roles WHERE code IN ('SUPER_ADMIN', 'QR_ADMIN')",
    )
    const [permissionRows] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_permissions WHERE code LIKE 'qrcode.%'",
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
      "DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code LIKE 'qrcode.%'",
    )
    await queryInterface.bulkDelete(
      'sys_permissions',
      { code: permissions.map(([, code]) => code) },
    )
    await queryInterface.dropTable('qr_codes')
    await queryInterface.dropTable('qr_generation_batches')
  },
}
