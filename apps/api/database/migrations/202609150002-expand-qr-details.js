'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('qr_codes', 'disabled', {
      type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
    })
    for (const [name, length] of [['student_gender', 10], ['grade', 100], ['student_no', 100], ['parent_relation', 50]]) {
      await queryInterface.addColumn('qr_student_bindings', name, {
        type: Sequelize.STRING(length), allowNull: true,
      })
    }
  },
  async down(queryInterface) {
    for (const name of ['parent_relation', 'student_no', 'grade', 'student_gender']) {
      await queryInterface.removeColumn('qr_student_bindings', name)
    }
    await queryInterface.removeColumn('qr_codes', 'disabled')
  },
}
