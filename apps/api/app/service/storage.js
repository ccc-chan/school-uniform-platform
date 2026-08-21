'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { Client } = require('minio')
const { Service } = require('egg')

/**
 * 统一封装本地和测试环境的 MinIO 对象读写。
 */
class StorageService extends Service {
  get client() {
    if (!this.app.storageClient) {
      const config = this.config.storage
      this.app.storageClient = new Client({
        endPoint: config.endpoint,
        port: config.port,
        useSSL: config.useSSL,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
      })
    }
    return this.app.storageClient
  }

  objectKey(category, filename) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const ext = path.extname(filename).toLowerCase()

    return `${category}/${year}/${month}/${crypto.randomUUID()}${ext}`
  }

  async putFile(key, filePath, size, contentType) {
    await this.client.putObject(
      this.config.storage.bucket,
      key,
      fs.createReadStream(filePath),
      size,
      { 'Content-Type': contentType },
    )
  }

  async getStream(key) {
    try {
      return await this.client.getObject(this.config.storage.bucket, key)
    } catch (error) {
      if (['NoSuchKey', 'NotFound', 'NoSuchObject'].includes(error.code)) {
        return null
      }
      throw error
    }
  }

  async delete(key) {
    await this.client.removeObject(this.config.storage.bucket, key)
  }
}

module.exports = StorageService
