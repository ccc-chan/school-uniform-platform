'use strict'

module.exports = (app) => app.model.define('QrStudentBinding', {
  qrCodeId: { type: app.Sequelize.BIGINT.UNSIGNED, primaryKey: true, field: 'qr_code_id' },
  schoolName: { type: app.Sequelize.STRING(100), field: 'school_name' },
  className: { type: app.Sequelize.STRING(100), field: 'class_name' },
  studentName: { type: app.Sequelize.STRING(100), field: 'student_name' },
  studentGender: { type: app.Sequelize.STRING(10), field: 'student_gender' },
  grade: app.Sequelize.STRING(100),
  studentNo: { type: app.Sequelize.STRING(100), field: 'student_no' },
  parentName: { type: app.Sequelize.STRING(100), field: 'parent_name' },
  parentRelation: { type: app.Sequelize.STRING(50), field: 'parent_relation' },
  phone: app.Sequelize.STRING(11),
  version: app.Sequelize.INTEGER.UNSIGNED,
}, { tableName: 'qr_student_bindings' })
