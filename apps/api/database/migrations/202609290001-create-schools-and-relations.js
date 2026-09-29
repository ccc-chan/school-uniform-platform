'use strict'

const schools = require('../data/maoming-schools.json')

module.exports = {
  async up(queryInterface, Sequelize) {
    const existingTables = new Set(await queryInterface.showAllTables())
    if (!existingTables.has('schools')) {
      await queryInterface.createTable('schools', {
        id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        school_code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
        name: { type: Sequelize.STRING(160), allowNull: false },
        school_type: { type: Sequelize.STRING(50), allowNull: false },
        address: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
        contact_phone: { type: Sequelize.STRING(50), allowNull: false, defaultValue: '' },
        organizer: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
        status: { type: Sequelize.ENUM('enabled', 'disabled'), allowNull: false, defaultValue: 'enabled' },
        source_updated_at: { type: Sequelize.DATEONLY, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })
      await queryInterface.addIndex('schools', ['status', 'name'])
      await queryInterface.addIndex('schools', ['school_type', 'name'])

      const now = new Date()
      const rows = schools.map((school) => ({
        school_code: school.code,
        name: school.name,
        school_type: school.schoolType,
        address: school.address,
        contact_phone: school.contactPhone,
        organizer: school.organizer,
        status: 'enabled',
        source_updated_at: '2026-09-28',
        created_at: now,
        updated_at: now,
      }))
      for (let index = 0; index < rows.length; index += 500) {
        await queryInterface.bulkInsert('schools', rows.slice(index, index + 500))
      }
    }

    if (!existingTables.has('product_schools')) {
      await queryInterface.createTable('product_schools', {
        product_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          references: { model: 'prd_products', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        school_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          references: { model: 'schools', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })
      await queryInterface.addIndex('product_schools', ['school_id'])
    }
    await queryInterface.sequelize.query(`
      INSERT IGNORE INTO product_schools (product_id, school_id, created_at, updated_at)
      SELECT p.id, s.id, NOW(), NOW()
      FROM prd_products p
      JOIN JSON_TABLE(
        COALESCE(p.applicable_schools, JSON_ARRAY()),
        '$[*]' COLUMNS (school_name VARCHAR(160) PATH '$')
      ) names
      JOIN schools s ON s.name COLLATE utf8mb4_unicode_ci = names.school_name COLLATE utf8mb4_unicode_ci`)

    const bindingColumns = await queryInterface.describeTable('qr_student_bindings')
    if (!bindingColumns.school_id) {
      await queryInterface.addColumn('qr_student_bindings', 'school_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'schools', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addIndex('qr_student_bindings', ['school_id'])
    }
    await queryInterface.sequelize.query(`
      UPDATE qr_student_bindings b
      JOIN schools s ON s.name COLLATE utf8mb4_unicode_ci = b.school_name COLLATE utf8mb4_unicode_ci
      SET b.school_id = s.id
      WHERE b.school_id IS NULL`)
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('qr_student_bindings', 'school_id')
    await queryInterface.dropTable('product_schools')
    await queryInterface.dropTable('schools')
  },
}
