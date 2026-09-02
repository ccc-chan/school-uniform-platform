'use strict'

const { Controller } = require('egg')

// 生产中心复用一组 CRUD 方法，仅允许路由声明过的资源类型进入服务层。
const resources = new Set(['orders', 'batches', 'processes', 'records', 'outbounds'])

/**
 * 生产订单、批次、工序、记录和出库记录的统一控制器。
 */
class ProductionController extends Controller {
  ok(data, message = 'success') {
    this.ctx.body = { code: 200, message, data }
  }

  fail(message, status = 400) {
    this.ctx.status = status
    this.ctx.body = { code: status, message, data: null }
  }

  resource() {
    // 显式路由参数优先；固定路由通过路径第四段识别当前资源。
    const value = String(this.ctx.params.resource || this.ctx.path.split('/')[4] || '')
    return resources.has(value) ? value : ''
  }

  async run(action) {
    // 将唯一键冲突和服务层业务异常映射为可读的客户端响应。
    try {
      await action()
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.fail('编号已存在，请重试')
      }
      if (error.status && error.status < 500) return this.fail(error.message, error.status)
      throw error
    }
  }

  async index() {
    await this.run(async () => {
      const resource = this.resource()
      if (!resource) return this.fail('生产资源类型无效', 404)

      // 服务层根据权限集合裁剪数量、日期、工厂等受控字段。
      const permissions = await this.ctx.service.auth.getPermissions(this.ctx.state.user.id)
      this.ok(await this.ctx.service.production.list(resource, this.ctx.query, permissions))
    })
  }

  async show() {
    await this.run(async () => {
      const resource = this.resource()
      const permissions = await this.ctx.service.auth.getPermissions(this.ctx.state.user.id)
      const item = await this.ctx.service.production.get(resource, Number(this.ctx.params.id), permissions)
      return item ? this.ok(item) : this.fail('数据不存在', 404)
    })
  }

  async create() {
    await this.run(async () => {
      const resource = this.resource()
      this.ok(await this.ctx.service.production.create(resource, this.ctx.request.body || {}), '创建成功')
    })
  }

  async update() {
    await this.run(async () => {
      const resource = this.resource()
      const item = await this.ctx.service.production.update(resource, Number(this.ctx.params.id), this.ctx.request.body || {})
      return item ? this.ok(item, '保存成功') : this.fail('数据不存在', 404)
    })
  }

  async updateStatus() {
    await this.run(async () => {
      const resource = this.resource()
      const item = await this.ctx.service.production.updateStatus(resource, Number(this.ctx.params.id), String(this.ctx.request.body?.status || ''))
      return item ? this.ok(item, '状态已更新') : this.fail('数据不存在', 404)
    })
  }

  async options() {
    this.ok(await this.ctx.service.production.options())
  }

  async createBatchStep() {
    await this.run(async () => {
      const item = await this.ctx.service.production.createBatchStep(
        Number(this.ctx.params.id),
        this.ctx.request.body || {},
      )
      this.ok(item, '环节添加成功')
    })
  }

  async deleteBatchStep() {
    await this.run(async () => {
      const deleted = await this.ctx.service.production.deleteBatchStep(
        Number(this.ctx.params.id),
        Number(this.ctx.params.stepId),
      )
      return deleted
        ? this.ok(null, '环节删除成功')
        : this.fail('生产环节不存在', 404)
    })
  }
}

module.exports = ProductionController
