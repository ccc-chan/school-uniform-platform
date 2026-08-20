'use strict'

/**
 * 产品质量报告，保存检测结果快照、PDF 附件、审核状态及审核信息。
 */
module.exports = (app) => {
  const QualityReport = app.model.define(
    'QualityReport',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      reportNo: { type: app.Sequelize.STRING, field: 'report_no' },
      name: app.Sequelize.STRING,
      productId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'product_id' },
      institution: app.Sequelize.STRING,
      inspectionNo: { type: app.Sequelize.STRING, field: 'inspection_no' },
      inspectionDate: { type: app.Sequelize.DATEONLY, field: 'inspection_date' },
      validUntil: { type: app.Sequelize.DATEONLY, field: 'valid_until' },
      fileId: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'file_id' },
      conclusion: app.Sequelize.STRING,
      status: app.Sequelize.STRING,
      resultItems: { type: app.Sequelize.JSON, field: 'result_items' },
      remarks: app.Sequelize.STRING,
      submittedBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'submitted_by' },
      reviewedBy: { type: app.Sequelize.BIGINT.UNSIGNED, field: 'reviewed_by' },
      reviewedAt: { type: app.Sequelize.DATE, field: 'reviewed_at' },
    },
    { tableName: 'quality_reports' },
  )

  // 报告关联受检产品、附件、提交员工和审核员工。
  QualityReport.associate = () => {
    QualityReport.belongsTo(app.model.Product, {
      as: 'product',
      foreignKey: 'productId',
    })
    QualityReport.belongsTo(app.model.File, {
      as: 'file',
      foreignKey: 'fileId',
    })
    QualityReport.belongsTo(app.model.Employee, {
      as: 'submitter',
      foreignKey: 'submittedBy',
    })
    QualityReport.belongsTo(app.model.Employee, {
      as: 'reviewer',
      foreignKey: 'reviewedBy',
    })
  }

  return QualityReport
}
