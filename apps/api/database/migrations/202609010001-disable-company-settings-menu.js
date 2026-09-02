'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate(
      'sys_menus',
      {
        status: 'disabled',
        updated_at: new Date(),
      },
      { code: 'shortcut_company_settings' },
    )
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate(
      'sys_menus',
      {
        status: 'enabled',
        updated_at: new Date(),
      },
      { code: 'shortcut_company_settings' },
    )
  },
}
