'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      english_name: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
      credit_code: { type: Sequelize.STRING(32), allowNull: false, unique: true },
      legal_representative: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
      industry: { type: Sequelize.STRING(120), allowNull: false, defaultValue: '' },
      region: { type: Sequelize.STRING(160), allowNull: false, defaultValue: '' },
      address: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
      contact_phone: { type: Sequelize.STRING(30), allowNull: false, defaultValue: '' },
      license_file_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'sys_files', key: 'id' }, onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('enabled', 'disabled'), allowNull: false, defaultValue: 'enabled' },
      created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, references: { model: 'sys_employees', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_0900_ai_ci' })
    await queryInterface.addIndex('companies', ['status', 'name'])
    await queryInterface.addColumn('prd_products', 'company_id', {
      type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
      references: { model: 'companies', key: 'id' }, onDelete: 'RESTRICT',
    })
    await queryInterface.addIndex('prd_products', ['company_id'])
    await queryInterface.sequelize.query(`
      INSERT INTO companies (name, credit_code, address, contact_phone, legal_representative, industry, region, status, created_at, updated_at)
      SELECT MAX(production_unit_name), production_unit_credit_code,
        MAX(production_unit_address), MAX(production_unit_contact), '', '', '', 'enabled', NOW(), NOW()
      FROM prd_products
      WHERE production_unit_credit_code IS NOT NULL AND production_unit_credit_code <> ''
      GROUP BY production_unit_credit_code`)
    await queryInterface.sequelize.query(`
      UPDATE prd_products p JOIN companies c
        ON c.credit_code = p.production_unit_credit_code
      SET p.company_id = c.id`)
    const now = new Date()
    const [groups] = await queryInterface.sequelize.query("SELECT id FROM sys_menus WHERE code='shortcut_group' LIMIT 1")
    await queryInterface.bulkInsert('sys_menus', [{
      name: '公司管理', code: 'shortcut_companies', path: '/companies',
      parent_id: groups[0]?.id || null, sort: 25, status: 'enabled', created_at: now, updated_at: now,
    }])
    const [roles] = await queryInterface.sequelize.query("SELECT id FROM sys_roles WHERE code='SUPER_ADMIN' LIMIT 1")
    const [menus] = await queryInterface.sequelize.query("SELECT id FROM sys_menus WHERE code='shortcut_companies' LIMIT 1")
    if (roles[0] && menus[0]) await queryInterface.bulkInsert('sys_role_menus', [{ role_id: roles[0].id, menu_id: menus[0].id, created_at: now }])
  },
  async down(queryInterface) {
    const [menus] = await queryInterface.sequelize.query("SELECT id FROM sys_menus WHERE code='shortcut_companies'")
    if (menus.length) await queryInterface.bulkDelete('sys_role_menus', { menu_id: menus.map((item) => item.id) })
    await queryInterface.bulkDelete('sys_menus', { code: 'shortcut_companies' })
    await queryInterface.removeColumn('prd_products', 'company_id')
    await queryInterface.dropTable('companies')
  },
}
