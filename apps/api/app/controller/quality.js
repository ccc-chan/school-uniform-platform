'use strict'

const { Controller } = require('egg')

/**
 * 质量报告、检测项目、审核和历史查询接口控制器。
 */
class QualityController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  async run(action) {
    // 将重复编号及服务层可预期异常转换为统一的客户端错误。
    try {
      await action()
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.fail('检测编号或项目编号已存在')
      }
      if (error.status && error.status < 500) return this.fail(error.message, error.status)
      throw error
    }
  }

  async options() {
    this.ok(await this.ctx.service.quality.options())
  }

  async reports() {
    // 服务层根据权限集合裁剪报告中的机构、附件等受控字段。
    const permissions = await this.ctx.service.auth.getPermissions(this.ctx.state.user.id)
    this.ok(await this.ctx.service.quality.listReports(this.ctx.query, permissions))
  }

  async report() {
    const permissions = await this.ctx.service.auth.getPermissions(this.ctx.state.user.id)
    const item = await this.ctx.service.quality.getReport(Number(this.ctx.params.id), permissions)
    return item ? this.ok(item) : this.fail('检测报告不存在', 404)
  }

  async createReport() {
    const file = this.ctx.request.files?.[0]

    // 报告创建无论成功或失败，都必须清理上传临时文件。
    try {
      await this.run(async () => {
        const item = await this.ctx.service.quality.createReport(this.ctx.request.body || {}, file)
        this.ok(item, '检测报告上传成功')
      })
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async quickCreateReport() {
    const file = this.ctx.request.files?.[0]
    try {
      await this.run(async () => {
        const item = await this.ctx.service.quality.createQuickReport(
          this.ctx.request.body || {},
          file,
        )
        this.ok(item, '质检报告上传成功')
      })
    } finally {
      await this.ctx.cleanupRequestFiles()
    }
  }

  async reviewReport() {
    await this.run(async () => {
      const item = await this.ctx.service.quality.reviewReport(
        Number(this.ctx.params.id),
        this.ctx.request.body || {},
      )
      return item ? this.ok(item, '审核状态已更新') : this.fail('检测报告不存在', 404)
    })
  }

  async deleteReport() {
    await this.run(async () => {
      const removed = await this.ctx.service.quality.deleteReport(
        Number(this.ctx.params.id),
      )
      return removed
        ? this.ok(null, '质检报告删除成功')
        : this.fail('检测报告不存在', 404)
    })
  }

  async reportFile() {
    // 设置附件文件名和媒体类型后直接返回文件流。
    const result = await this.ctx.service.quality.getReportFile(Number(this.ctx.params.id))
    if (!result) return this.fail('报告文件不存在', 404)
    this.ctx.attachment(result.item.originalName)
    this.ctx.type = result.item.mimeType
    this.ctx.body = result.stream
  }

  async items() {
    this.ok(await this.ctx.service.quality.listItems(this.ctx.query))
  }

  async createItem() {
    await this.run(async () => {
      this.ok(await this.ctx.service.quality.createItem(this.ctx.request.body || {}), '检测项目创建成功')
    })
  }

  async updateItem() {
    await this.run(async () => {
      const item = await this.ctx.service.quality.updateItem(
        Number(this.ctx.params.id),
        this.ctx.request.body || {},
      )
      return item ? this.ok(item, '检测项目保存成功') : this.fail('检测项目不存在', 404)
    })
  }

  async updateItemStatus() {
    await this.run(async () => {
      const item = await this.ctx.service.quality.updateItemStatus(
        Number(this.ctx.params.id),
        String(this.ctx.request.body?.status || ''),
      )
      return item ? this.ok(item, '检测项目状态已更新') : this.fail('检测项目不存在', 404)
    })
  }

  async history() {
    this.ok(await this.ctx.service.quality.history(this.ctx.query))
  }
}

module.exports = QualityController
