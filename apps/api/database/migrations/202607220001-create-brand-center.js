'use strict'

// 品牌中心权限分别控制资料管理、内容类型管理和主页字段可见性。
const permissions = [
  ['查看品牌中心', 'brand.view'],
  ['管理品牌资料', 'brand.profile.manage'],
  ['管理品牌故事', 'brand.story.manage'],
  ['管理工厂展示', 'brand.factory.manage'],
  ['管理视频资料', 'brand.video.manage'],
  ['查看品牌名称字段', 'brand.field.name'],
  ['查看品牌 Logo 字段', 'brand.field.logo'],
  ['查看品牌介绍字段', 'brand.field.introduction'],
  ['查看品牌官网字段', 'brand.field.website'],
  ['查看品牌电话字段', 'brand.field.phone'],
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
 * 建立品牌主页和品牌内容表，并注册品牌中心菜单与操作权限。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableOptions = {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    }

    await queryInterface.createTable('brand_profiles', {
      id: id(Sequelize),
      name: { type: Sequelize.STRING(120), allowNull: false },
      logo_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_files', key: 'id' },
        onDelete: 'SET NULL',
      },
      introduction: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: '',
      },
      updated_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('brand_assets', {
      id: id(Sequelize),
      type: {
        type: Sequelize.ENUM('story', 'factory', 'video'),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      subtitle: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      location: {
        type: Sequelize.STRING(160),
        allowNull: false,
        defaultValue: '',
      },
      cover_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_files', key: 'id' },
        onDelete: 'SET NULL',
      },
      media_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_files', key: 'id' },
        onDelete: 'SET NULL',
      },
      sort: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
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
      updated_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.addIndex('brand_assets', ['type', 'status', 'sort'])
    await queryInterface.addIndex('brand_assets', ['updated_at'])

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
      "SELECT id FROM sys_roles WHERE code='SUPER_ADMIN' LIMIT 1",
    )
    const [permissionRows] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_permissions WHERE code LIKE 'brand.%'",
    )
    if (roles[0]) {
      await queryInterface.bulkInsert(
        'sys_role_permissions',
        permissionRows.map(({ id: permissionId }) => ({
          role_id: roles[0].id,
          permission_id: permissionId,
          created_at: now,
        })),
      )
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code LIKE 'brand.%'",
    )
    await queryInterface.bulkDelete(
      'sys_permissions',
      { code: permissions.map(([, code]) => code) },
    )
    await queryInterface.dropTable('brand_assets')
    await queryInterface.dropTable('brand_profiles')
  },
}
