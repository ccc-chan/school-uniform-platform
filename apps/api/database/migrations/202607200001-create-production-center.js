'use strict'

// 生产中心权限覆盖资源操作以及客户、数量、工厂等字段可见性。
const permissions = [
  ['查看生产中心', 'production.view'],
  ['新建生产订单', 'production.order.create'],
  ['编辑生产订单', 'production.order.edit'],
  ['更新生产订单状态', 'production.order.status'],
  ['管理生产批次', 'production.batch.manage'],
  ['管理生产流程', 'production.process.manage'],
  ['管理生产记录', 'production.record.manage'],
  ['管理工厂资料', 'production.factory.manage'],
  ['管理出厂记录', 'production.outbound.manage'],
  ['查看客户字段', 'production.field.customer'],
  ['查看生产产品字段', 'production.field.product'],
  ['查看生产数量字段', 'production.field.quantity'],
  ['查看生产日期字段', 'production.field.date'],
  ['查看生产工厂字段', 'production.field.factory'],
  ['查看生产员工字段', 'production.field.employee'],
  ['查看生产状态字段', 'production.field.status'],
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
 * 建立工厂、订单、工序、批次、生产记录和出库记录等生产中心表。
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableOptions = {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    }

    await queryInterface.createTable('production_factories', {
      id: id(Sequelize),
      code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      contact_name: { type: Sequelize.STRING(50), allowNull: false },
      contact_phone: { type: Sequelize.STRING(30), allowNull: false },
      address: { type: Sequelize.STRING(255), allowNull: false },
      daily_capacity: {
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
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('production_orders', {
      id: id(Sequelize),
      order_no: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      customer_name: { type: Sequelize.STRING(120), allowNull: false },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'prd_products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      delivery_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'scheduled', 'producing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('production_processes', {
      id: id(Sequelize),
      flow_name: { type: Sequelize.STRING(100), allowNull: false },
      node_name: { type: Sequelize.STRING(100), allowNull: false },
      node_order: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      consumer_visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

    await queryInterface.createTable('production_batches', {
      id: id(Sequelize),
      batch_no: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'production_orders', key: 'id' },
        onDelete: 'RESTRICT',
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'prd_products', key: 'id' },
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      production_date: { type: Sequelize.DATEONLY, allowNull: false },
      factory_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'production_factories', key: 'id' },
        onDelete: 'RESTRICT',
      },
      responsible_employee_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM('planned', 'in_progress', 'paused', 'completed'),
        allowNull: false,
        defaultValue: 'planned',
      },
      notes: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('production_records', {
      id: id(Sequelize),
      batch_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'production_batches', key: 'id' },
        onDelete: 'RESTRICT',
      },
      employee_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'RESTRICT',
      },
      process_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'production_processes', key: 'id' },
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      started_at: { type: Sequelize.DATE, allowNull: false },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'exception'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.createTable('production_outbounds', {
      id: id(Sequelize),
      outbound_no: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      batch_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'production_batches', key: 'id' },
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      outbound_date: { type: Sequelize.DATEONLY, allowNull: false },
      recipient: { type: Sequelize.STRING(120), allowNull: false },
      destination: { type: Sequelize.STRING(255), allowNull: false },
      handled_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM('pending', 'shipped', 'received', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: { type: Sequelize.STRING(500), allowNull: false, defaultValue: '' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'sys_employees', key: 'id' },
        onDelete: 'SET NULL',
      },
      ...timestamps(Sequelize),
    }, tableOptions)

    await queryInterface.addIndex('production_orders', ['status', 'delivery_date'])
    await queryInterface.addIndex('production_batches', ['order_id', 'status'])
    await queryInterface.addIndex('production_batches', ['factory_id', 'production_date'])
    await queryInterface.addIndex('production_processes', ['flow_name', 'node_order'])
    await queryInterface.addIndex('production_records', ['batch_id', 'started_at'])
    await queryInterface.addIndex('production_outbounds', ['batch_id', 'outbound_date'])

    const now = new Date()
    await queryInterface.bulkInsert(
      'sys_permissions',
      permissions.map(([name, code]) => ({ name, code, created_at: now, updated_at: now })),
    )
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_roles WHERE code IN ('SUPER_ADMIN', 'PRODUCTION_ADMIN')",
    )
    const [permissionRows] = await queryInterface.sequelize.query(
      "SELECT id FROM sys_permissions WHERE code LIKE 'production.%'",
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
      "DELETE rp FROM sys_role_permissions rp JOIN sys_permissions p ON p.id=rp.permission_id WHERE p.code LIKE 'production.%'",
    )
    await queryInterface.bulkDelete(
      'sys_permissions',
      { code: permissions.map(([, code]) => code) },
    )
    for (const table of [
      'production_outbounds',
      'production_records',
      'production_batches',
      'production_processes',
      'production_orders',
      'production_factories',
    ]) await queryInterface.dropTable(table)
  },
}
