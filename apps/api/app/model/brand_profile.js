'use strict'

/**
 * 品牌主页资料；系统固定使用单条记录保存品牌名称、介绍和联系方式。
 */
module.exports = (app) => {
  const BrandProfile = app.model.define(
    'BrandProfile',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: app.Sequelize.STRING,
      logoFileId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'logo_file_id',
      },
      introduction: app.Sequelize.TEXT,
      website: app.Sequelize.STRING,
      phone: app.Sequelize.STRING,
      updatedBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'updated_by',
      },
    },
    { tableName: 'brand_profiles' },
  )

  // 品牌资料关联 Logo 文件和最后更新员工。
  BrandProfile.associate = () => {
    BrandProfile.belongsTo(app.model.File, {
      as: 'logoFile',
      foreignKey: 'logoFileId',
    })
    BrandProfile.belongsTo(app.model.Employee, {
      as: 'updater',
      foreignKey: 'updatedBy',
    })
  }

  return BrandProfile
}
