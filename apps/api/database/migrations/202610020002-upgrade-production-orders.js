'use strict'

const menuCode = 'shortcut_production'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('production_orders', 'company_id', {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }, { transaction })
      await queryInterface.addColumn('production_orders', 'sizes', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      }, { transaction })
      await queryInterface.sequelize.query(
        "UPDATE production_orders SET status = CASE WHEN status IN ('scheduled', 'cancelled') THEN 'pending' ELSE status END",
        { transaction },
      )
      await queryInterface.changeColumn('production_orders', 'status', {
        type: Sequelize.ENUM('pending', 'producing', 'completed', 'warehoused'),
        allowNull: false,
        defaultValue: 'pending',
      }, { transaction })
      await queryInterface.changeColumn('production_orders', 'customer_name', {
        type: Sequelize.STRING(120),
        allowNull: true,
      }, { transaction })
      await queryInterface.changeColumn('production_orders', 'quantity', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      }, { transaction })
      await queryInterface.changeColumn('production_orders', 'delivery_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      }, { transaction })

      const [groups] = await queryInterface.sequelize.query(
        "SELECT id FROM sys_menus WHERE code = 'shortcut_group' LIMIT 1",
        { transaction },
      )
      const parentId = groups[0]?.id
      if (parentId) {
        await queryInterface.bulkInsert('sys_menus', [{
          name: '生产管理',
          code: menuCode,
          path: '/production/orders',
          parent_id: parentId,
          sort: 35,
          status: 'enabled',
          created_at: new Date(),
          updated_at: new Date(),
        }], { transaction })
        const [menus] = await queryInterface.sequelize.query(
          `SELECT id FROM sys_menus WHERE code = '${menuCode}' LIMIT 1`,
          { transaction },
        )
        const menuId = menus[0]?.id
        if (menuId) {
          const [roles] = await queryInterface.sequelize.query(
            "SELECT id FROM sys_roles WHERE code IN ('SUPER_ADMIN', 'PRODUCTION_ADMIN')",
            { transaction },
          )
          if (roles.length) {
            await queryInterface.bulkInsert('sys_role_menus', roles.map(role => ({
              role_id: role.id,
              menu_id: menuId,
              created_at: new Date(),
            })), { transaction })
          }
        }
      }
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [menus] = await queryInterface.sequelize.query(
        `SELECT id FROM sys_menus WHERE code = '${menuCode}'`,
        { transaction },
      )
      if (menus.length) {
        await queryInterface.bulkDelete('sys_role_menus', { menu_id: menus.map(item => item.id) }, { transaction })
        await queryInterface.bulkDelete('sys_menus', { code: menuCode }, { transaction })
      }
      await queryInterface.changeColumn('production_orders', 'status', {
        type: Sequelize.ENUM('pending', 'scheduled', 'producing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      }, { transaction })
      await queryInterface.removeColumn('production_orders', 'sizes', { transaction })
      await queryInterface.removeColumn('production_orders', 'company_id', { transaction })
    })
  },
}
