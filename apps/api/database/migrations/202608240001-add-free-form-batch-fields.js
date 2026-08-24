'use strict'

const table = 'production_batches'
const optionalRelations = [
  {
    column: 'order_id',
    name: 'fk_production_batches_order_id_optional',
    references: { table: 'production_orders', field: 'id' },
  },
  {
    column: 'factory_id',
    name: 'fk_production_batches_factory_id_optional',
    references: { table: 'production_factories', field: 'id' },
  },
  {
    column: 'responsible_employee_id',
    name: 'fk_production_batches_responsible_employee_id_optional',
    references: { table: 'sys_employees', field: 'id' },
  },
]

async function removeRelationConstraints(queryInterface, transaction) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME AS constraintName
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = '${table}'
       AND COLUMN_NAME IN ('order_id', 'factory_id', 'responsible_employee_id')
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { transaction },
  )

  for (const row of rows) {
    await queryInterface.removeConstraint(
      table,
      row.constraintName,
      { transaction },
    )
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        table,
        'order_no',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      )
      await queryInterface.addColumn(
        table,
        'factory_name',
        { type: Sequelize.STRING(120), allowNull: true },
        { transaction },
      )
      await queryInterface.addColumn(
        table,
        'responsible_employee_name',
        { type: Sequelize.STRING(80), allowNull: true },
        { transaction },
      )

      await queryInterface.sequelize.query(
        `UPDATE production_batches b
         JOIN production_orders o ON o.id = b.order_id
         JOIN production_factories f ON f.id = b.factory_id
         JOIN sys_employees e ON e.id = b.responsible_employee_id
         SET b.order_no = o.order_no,
             b.factory_name = f.name,
             b.responsible_employee_name = e.name`,
        { transaction },
      )

      await queryInterface.changeColumn(
        table,
        'order_no',
        { type: Sequelize.STRING(120), allowNull: false },
        { transaction },
      )
      await queryInterface.changeColumn(
        table,
        'factory_name',
        { type: Sequelize.STRING(120), allowNull: false },
        { transaction },
      )
      await queryInterface.changeColumn(
        table,
        'responsible_employee_name',
        { type: Sequelize.STRING(80), allowNull: false },
        { transaction },
      )

      await removeRelationConstraints(queryInterface, transaction)

      for (const relation of optionalRelations) {
        await queryInterface.changeColumn(
          table,
          relation.column,
          { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          { transaction },
        )
        await queryInterface.addConstraint(table, {
          fields: [relation.column],
          type: 'foreign key',
          name: relation.name,
          references: relation.references,
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          transaction,
        })
      }
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) AS total
         FROM production_batches
         WHERE order_id IS NULL
            OR factory_id IS NULL
            OR responsible_employee_id IS NULL`,
        { transaction },
      )

      if (Number(rows[0].total) > 0) {
        throw new Error('存在自由填写的生产批次，无法恢复为必填关联字段')
      }

      for (const relation of optionalRelations) {
        await queryInterface.removeConstraint(
          table,
          relation.name,
          { transaction },
        )
        await queryInterface.changeColumn(
          table,
          relation.column,
          { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
          { transaction },
        )
        await queryInterface.addConstraint(table, {
          fields: [relation.column],
          type: 'foreign key',
          name: relation.name.replace('_optional', '_required'),
          references: relation.references,
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
          transaction,
        })
      }

      await queryInterface.removeColumn(table, 'order_no', { transaction })
      await queryInterface.removeColumn(table, 'factory_name', { transaction })
      await queryInterface.removeColumn(
        table,
        'responsible_employee_name',
        { transaction },
      )
    })
  },
}
