'use strict'

const fsp = require('node:fs/promises')
const { Op } = require('sequelize')
const { Service } = require('egg')

class CompaniesService extends Service {
  json(item) {
    return {
      id: Number(item.id), name: item.name, englishName: item.englishName || '',
      creditCode: item.creditCode, legalRepresentative: item.legalRepresentative || '',
      industry: item.industry || '', region: item.region || '', address: item.address || '',
      contactPhone: item.contactPhone || '', licenseFileId: item.licenseFileId ? Number(item.licenseFileId) : null,
      status: item.status, createdAt: this.ctx.helper.formatDateTime(item.createdAt),
    }
  }

  async log(action, item) {
    const row = await this.app.model.OperationLog.create({
      employeeId: this.ctx.state.user.id, module: '公司管理', action,
      targetType: 'company', targetId: item.id,
      detail: { context: { name: item.name, creditCode: item.creditCode } },
      ip: this.ctx.ip,
    })
    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(row.id))
  }

  async list(query) {
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const where = {}
    const keyword = String(query.keyword || '').trim()
    if (keyword) where[Op.or] = ['name', 'englishName', 'creditCode'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
    if (['enabled', 'disabled'].includes(query.status)) where.status = query.status
    const { rows, count } = await this.app.model.Company.findAndCountAll({ where, order: [['id', 'DESC']], limit: pageSize, offset })
    return { items: rows.map((item) => this.json(item)), total: count, page, pageSize }
  }

  async options() {
    const rows = await this.app.model.Company.findAll({ where: { status: 'enabled' }, order: [['name', 'ASC']] })
    return rows.map((item) => this.json(item))
  }

  async saveLicense(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mime)) throw Object.assign(new Error('营业执照仅支持 JPG、PNG、WEBP 图片'), { status: 400 })
    const size = (await fsp.stat(file.filepath)).size
    if (size > 10 * 1024 * 1024) throw Object.assign(new Error('营业执照图片不能超过 10MB'), { status: 400 })
    const storedName = this.ctx.service.storage.objectKey('company-licenses', file.filename)
    await this.ctx.service.storage.putFile(storedName, file.filepath, size, file.mime)
    return this.app.model.File.create({ originalName: file.filename, storedName, mimeType: file.mime, category: 'company_license', size, uploadedBy: this.ctx.state.user.id })
  }

  async create(value, file) {
    const license = file ? await this.saveLicense(file) : null
    try {
      const item = await this.app.model.Company.create({ ...value, licenseFileId: license?.id || null, status: 'enabled', createdBy: this.ctx.state.user.id })
      await this.log('新增公司', item)
      return this.json(item)
    } catch (error) {
      if (license) { await license.destroy(); await this.ctx.service.storage.delete(license.storedName).catch(() => {}) }
      throw error
    }
  }

  async update(id, value, file) {
    const item = await this.app.model.Company.findByPk(id)
    if (!item) return null
    const license = file ? await this.saveLicense(file) : null
    const oldLicenseId = item.licenseFileId
    await item.update({ ...value, ...(license ? { licenseFileId: license.id } : {}) })
    await this.log('修改公司', item)
    if (license && oldLicenseId) await this.removeLicense(oldLicenseId)
    return this.json(item)
  }

  async setStatus(id, status) {
    const item = await this.app.model.Company.findByPk(id)
    if (!item) return null
    await item.update({ status })
    await this.log(status === 'enabled' ? '启用公司' : '停用公司', item)
    return this.json(item)
  }

  async destroy(id) {
    const item = await this.app.model.Company.findByPk(id)
    if (!item) return null
    if (await this.app.model.Product.count({ where: { companyId: id } })) return { conflict: true }
    const licenseId = item.licenseFileId
    await this.log('删除公司', item)
    await item.destroy()
    if (licenseId) await this.removeLicense(licenseId)
    return { conflict: false }
  }

  async removeLicense(id) {
    const file = await this.app.model.File.findByPk(id)
    if (!file) return
    await file.destroy()
    await this.ctx.service.storage.delete(file.storedName).catch(() => {})
  }

  async license(id) {
    const item = await this.app.model.Company.findByPk(id, { include: [{ model: this.app.model.File, as: 'licenseFile' }] })
    if (!item?.licenseFile) return null
    const stream = await this.ctx.service.storage.getStream(item.licenseFile.storedName)
    return stream ? { item: item.licenseFile, stream } : null
  }
}

module.exports = CompaniesService
