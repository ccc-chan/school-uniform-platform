'use strict'

// 扩展产品字段时同步注册产品菜单内使用的字段和操作权限。
const permissions = [
  ['查看产品列表', 'product.view'], ['查看产品图片字段', 'product.field.image'],
  ['查看产品编号字段', 'product.field.code'], ['查看产品名称字段', 'product.field.name'],
  ['查看产品分类字段', 'product.field.category'], ['查看产品季节字段', 'product.field.season'],
  ['查看产品状态字段', 'product.field.status'], ['查看产品创建时间字段', 'product.field.created_at'],
  ['新建产品', 'product.create'], ['编辑产品', 'product.edit'],
  ['更新产品状态', 'product.status'], ['删除产品', 'product.delete'],
]

/**
 * 补充产品详情、适用学校、尺码和图片字段，并授权超级管理员。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('prd_products', 'applicable_schools', { type: Sequelize.JSON, allowNull: true })
    await queryInterface.addColumn('prd_products', 'style', { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' })
    await queryInterface.addColumn('prd_products', 'color', { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' })
    await queryInterface.addColumn('prd_products', 'sizes', { type: Sequelize.JSON, allowNull: true })
    await queryInterface.addColumn('prd_products', 'fabric_info', { type: Sequelize.TEXT, allowNull: true })
    await queryInterface.addColumn('prd_products', 'execution_standard', { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' })
    await queryInterface.addColumn('prd_products', 'washing_instructions', { type: Sequelize.TEXT, allowNull: true })
    await queryInterface.addColumn('prd_products', 'image_id', { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'sys_files', key: 'id' }, onDelete: 'SET NULL' })
    await queryInterface.changeColumn('prd_products', 'school_stage', { type: Sequelize.STRING(20), allowNull: true })
    // 新权限默认分配给超级管理员，其他角色由后台按需配置。
    const now = new Date()
    await queryInterface.bulkInsert('sys_permissions', permissions.map(([name, code]) => ({ name, code, created_at: now, updated_at: now })))
    const [rows] = await queryInterface.sequelize.query("SELECT id FROM sys_roles WHERE code='SUPER_ADMIN' LIMIT 1")
    const [permissionRows] = await queryInterface.sequelize.query("SELECT id FROM sys_permissions WHERE code LIKE 'product.%'")
    if (rows[0]) await queryInterface.bulkInsert('sys_role_permissions', permissionRows.map(({ id }) => ({ role_id: rows[0].id, permission_id: id, created_at: now })))
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query("DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code LIKE 'product.%'")
    await queryInterface.bulkDelete('sys_permissions', { code: permissions.map(([, code]) => code) })
    for (const column of ['image_id','washing_instructions','execution_standard','fabric_info','sizes','color','style','applicable_schools']) await queryInterface.removeColumn('prd_products', column)
  },
}
