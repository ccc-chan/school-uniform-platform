'use strict'

/**
 * 检测项目定义，保存项目编号、分类、标准要求、单位和启停状态。
 */
module.exports = (app) =>
  app.model.define(
    'QualityInspectionItem',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      code: app.Sequelize.STRING,
      name: app.Sequelize.STRING,
      category: app.Sequelize.STRING,
      standardRequirement: {
        type: app.Sequelize.STRING,
        field: 'standard_requirement',
      },
      unit: app.Sequelize.STRING,
      status: app.Sequelize.STRING,
      createdBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'created_by',
      },
    },
    { tableName: 'quality_inspection_items' },
  )
