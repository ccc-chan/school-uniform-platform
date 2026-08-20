'use strict'

/**
 * 文件元数据模型；二进制内容保存在磁盘，storedName 用于定位物理文件。
 */
module.exports = (app) =>
  app.model.define(
    'File',
    {
      id: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      originalName: { type: app.Sequelize.STRING, field: 'original_name' },
      storedName: { type: app.Sequelize.STRING, field: 'stored_name' },
      mimeType: { type: app.Sequelize.STRING, field: 'mime_type' },
      category: app.Sequelize.STRING,
      size: app.Sequelize.BIGINT.UNSIGNED,
      uploadedBy: {
        type: app.Sequelize.BIGINT.UNSIGNED,
        field: 'uploaded_by',
      },
    },
    { tableName: 'sys_files', updatedAt: false },
  )
