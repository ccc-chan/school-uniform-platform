'use strict'

/**
 * 品牌故事、工厂展示和品牌视频的统一内容模型。
 */
module.exports = (app) => {
  const BrandAsset = app.model.define(
    'BrandAsset',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      type: app.Sequelize.STRING,
      title: app.Sequelize.STRING,
      subtitle: app.Sequelize.STRING,
      content: app.Sequelize.TEXT,
      location: app.Sequelize.STRING,
      coverFileId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'cover_file_id',
      },
      mediaFileId: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'media_file_id',
      },
      sort: app.Sequelize.INTEGER.UNSIGNED,
      status: app.Sequelize.STRING,
      createdBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'created_by',
      },
      updatedBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'updated_by',
      },
    },
    { tableName: 'brand_assets' },
  )

  // 内容可关联封面、媒体文件，以及创建人和最后更新人。
  BrandAsset.associate = () => {
    BrandAsset.belongsTo(app.model.File, {
      as: 'coverFile',
      foreignKey: 'coverFileId',
    })
    BrandAsset.belongsTo(app.model.File, {
      as: 'mediaFile',
      foreignKey: 'mediaFileId',
    })
    BrandAsset.belongsTo(app.model.Employee, {
      as: 'creator',
      foreignKey: 'createdBy',
    })
    BrandAsset.belongsTo(app.model.Employee, {
      as: 'updater',
      foreignKey: 'updatedBy',
    })
  }

  return BrandAsset
}
