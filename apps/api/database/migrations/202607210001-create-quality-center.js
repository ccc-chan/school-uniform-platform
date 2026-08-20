'use strict'

// 质量中心权限覆盖报告操作、检测项目管理及报告字段可见性。
const permissions = [
  ['查看检测中心', 'quality.view'],
  ['上传检测报告', 'quality.report.create'],
  ['审核检测报告', 'quality.report.review'],
  ['下载检测报告', 'quality.report.download'],
  ['管理检测项目', 'quality.item.manage'],
  ['查看检测产品字段', 'quality.field.product'],
  ['查看检测机构字段', 'quality.field.institution'],
  ['查看检测日期字段', 'quality.field.date'],
  ['查看检测状态字段', 'quality.field.status'],
  ['查看检测结果字段', 'quality.field.result'],
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

const id = (Sequelize) => ({
  type: Sequelize.BIGINT.UNSIGNED,
  primaryKey: true,
  autoIncrement: true,
})

/**
 * 建立检测项目和质量报告表，并注册质量中心菜单与操作权限。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableOptions = {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    }

    await queryInterface.createTable('quality_inspection_items', {
      id: id(Sequelize),
      code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      category: { type: Sequelize.STRING(80), allowNull: false },
      standard_requirement: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      unit: { type: Sequelize.STRING(30), allowNull: false, defaultValue: '' },
      status: {
        type: Sequelize.ENUM('enabled', 'disabled'),
        allowNull: false,
        defaultValue: 'enabled',
      },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('quality_reports', {
      id: id(Sequelize),
      report_no: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'prd_products', key: 'id' },
        onDelete: 'RESTRICT',
      },
      institution: { type: Sequelize.STRING(160), allowNull: false },
      inspection_no: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      inspection_date: { type: Sequelize.DATEONLY, allowNull: false },
      valid_until: { type: Sequelize.DATEONLY, allowNull: false },
      file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'sys_files', key: 'id' },
        onDelete: 'RESTRICT',
      },
      conclusion: {
        type: Sequelize.ENUM('qualified', 'unqualified'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      result_items: { type: Sequelize.JSON, allowNull: false },
      remarks: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      submitted_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewed_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.addIndex('quality_inspection_items', ['category', 'status'])
    await queryInterface.addIndex('quality_reports', ['product_id', 'status'])
    await queryInterface.addIndex('quality_reports', ['inspection_date', 'valid_until'])
    await queryInterface.addIndex('quality_reports', ['institution'])

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
      "SELECT id, code FROM sys_roles WHERE code IN ('SUPER_ADMIN', 'QUALITY_INSPECTOR')",
    )
    const [permissionRows] = await queryInterface.sequelize.query(
      "SELECT id, code FROM sys_permissions WHERE code LIKE 'quality.%'",
    )
    const inspectorPermissions = new Set([
      'quality.view',
      'quality.report.create',
      'quality.report.download',
      'quality.item.manage',
      'quality.field.product',
      'quality.field.institution',
      'quality.field.date',
      'quality.field.status',
      'quality.field.result',
    ])
    const grants = roles.flatMap((role) =>
      permissionRows
        .filter((permission) =>
          role.code === 'SUPER_ADMIN' || inspectorPermissions.has(permission.code),
        )
        .map((permission) => ({
          role_id: role.id,
          permission_id: permission.id,
          created_at: now,
        })),
    )
    if (grants.length) await queryInterface.bulkInsert('sys_role_permissions', grants)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code LIKE 'quality.%'",
    )
    await queryInterface.bulkDelete(
      'sys_permissions',
      { code: permissions.map(([, code]) => code) },
    )
    await queryInterface.dropTable('quality_reports')
    await queryInterface.dropTable('quality_inspection_items')
  },
}
