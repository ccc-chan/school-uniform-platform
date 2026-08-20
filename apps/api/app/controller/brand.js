'use strict'

const { Controller } = require('egg')

/**
 * 品牌资料及品牌故事、工厂和视频内容的接口控制器。
 */
class BrandController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  async run(action) {
    // 服务层主动抛出的 4xx 业务错误转换为统一响应，未知异常继续交给框架处理。
    try {
      await action()
    } catch (error) {
      if (error.status && error.status < 500) {
        return this.fail(error.message, error.status)
      }
      throw error
    }
  }

  payload() {
    // multipart 请求将结构化字段放在 payload 中；普通 JSON 请求直接使用 body。
    const value = this.ctx.request.body?.payload
    if (!value) return this.ctx.request.body || {}
    try {
      return JSON.parse(value)
    } catch {
      const error = new Error('提交数据格式不正确')
      error.status = 400
      throw error
    }
  }

  async profile() {
    // 权限集合会传给服务层，用于裁剪用户无权查看的品牌字段。
    const permissions = await this.ctx.service.auth.getPermissions(
      this.ctx.state.user.id,
    )
    this.ok(await this.ctx.service.brand.getProfile(permissions))
  }

  async updateProfile() {
    try {
      await this.run(async () => {
        const item = await this.ctx.service.brand.updateProfile(
          this.payload(),
          this.ctx.request.files || [],
        )
        this.ok(item, '品牌资料保存成功')
      })
    } finally {
      // 无论业务成功或失败，都清理 multipart 上传产生的临时文件。
      await this.ctx.cleanupRequestFiles()
    }
  }

  async assets() {
    await this.run(async () => {
      this.ok(
        await this.ctx.service.brand.listAssets(
          this.ctx.params.type,
          this.ctx.query,
        ),
      )
    })
  }

  async createAsset() {
    try {
      await this.run(async () => {
        const item = await this.ctx.service.brand.createAsset(
          this.ctx.params.type,
          this.payload(),
          this.ctx.request.files || [],
        )
        this.ok(item, '品牌内容创建成功')
      })
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async updateAsset() {
    try {
      await this.run(async () => {
        const item = await this.ctx.service.brand.updateAsset(
          this.ctx.params.type,
          Number(this.ctx.params.id),
          this.payload(),
          this.ctx.request.files || [],
        )
        return item
          ? this.ok(item, '品牌内容保存成功')
          : this.fail('品牌内容不存在', 404)
      })
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async updateAssetStatus() {
    await this.run(async () => {
      const item = await this.ctx.service.brand.updateAssetStatus(
        this.ctx.params.type,
        Number(this.ctx.params.id),
        String(this.ctx.request.body?.status || ''),
      )
      return item
        ? this.ok(item, '品牌内容状态已更新')
        : this.fail('品牌内容不存在', 404)
    })
  }

  async deleteAsset() {
    await this.run(async () => {
      const removed = await this.ctx.service.brand.deleteAsset(
        this.ctx.params.type,
        Number(this.ctx.params.id),
      )
      return removed
        ? this.ok(null, '品牌内容删除成功')
        : this.fail('品牌内容不存在', 404)
    })
  }

  async media() {
    // 媒体文件以流形式响应，避免将完整文件读入 Node.js 内存。
    const result = await this.ctx.service.brand.getMedia(
      Number(this.ctx.params.id),
    )
    if (!result) return this.fail('品牌媒体文件不存在', 404)
    this.ctx.type = result.item.mimeType
    this.ctx.body = result.stream
  }
}

module.exports = BrandController
