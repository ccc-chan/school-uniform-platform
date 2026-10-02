'use strict'

const fsp = require('node:fs/promises')
const { Op } = require('sequelize')
const { Service } = require('egg')

class CompaniesService extends Service {
  json(item) {
    return {
      id: Number(item.id), code: item.code, name: item.name, brandName: item.brandName || '',
      creditCode: item.creditCode, legalRepresentative: item.legalRepresentative || '',
      region: item.region || '', address: item.address || '', introduction: item.introduction || '',
      contactPhone: item.contactPhone || '', licenseFileId: item.licenseFileId ? Number(item.licenseFileId) : null,
      logoFileId: item.logoFileId ? Number(item.logoFileId) : null,
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
    if (keyword) where[Op.or] = ['name', 'brandName', 'creditCode'].map((key) => ({ [key]: { [Op.like]: `%${keyword}%` } }))
    if (['enabled', 'disabled'].includes(query.status)) where.status = query.status
    const { rows, count } = await this.app.model.Company.findAndCountAll({ where, order: [['id', 'DESC']], limit: pageSize, offset })
    return { items: rows.map((item) => this.json(item)), total: count, page, pageSize }
  }

  async options() {
    const rows = await this.app.model.Company.findAll({ where: { status: 'enabled' }, order: [['name', 'ASC']] })
    return rows.map((item) => this.json(item))
  }

  async codeExists(code, excludeId = null) {
    const where = { code }
    if (excludeId) where.id = { [Op.ne]: excludeId }
    return Boolean(await this.app.model.Company.count({ where }))
  }

  async saveLicense(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mime)) throw Object.assign(new Error('营业执照仅支持 JPG、PNG、WEBP 图片'), { status: 400 })
    const size = (await fsp.stat(file.filepath)).size
    if (size > 10 * 1024 * 1024) throw Object.assign(new Error('营业执照图片不能超过 10MB'), { status: 400 })
    const storedName = this.ctx.service.storage.objectKey('company-licenses', file.filename)
    await this.ctx.service.storage.putFile(storedName, file.filepath, size, file.mime)
    return this.app.model.File.create({ originalName: file.filename, storedName, mimeType: file.mime, category: 'company_license', size, uploadedBy: this.ctx.state.user.id })
  }

  async saveLogo(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mime)) throw Object.assign(new Error('品牌 Logo 仅支持 JPG、PNG、WEBP 图片'), { status: 400 })
    const size = (await fsp.stat(file.filepath)).size
    if (size > 2 * 1024 * 1024) throw Object.assign(new Error('品牌 Logo 图片不能超过 2MB'), { status: 400 })
    const storedName = this.ctx.service.storage.objectKey('company-logos', file.filename)
    await this.ctx.service.storage.putFile(storedName, file.filepath, size, file.mime)
    return this.app.model.File.create({ originalName: file.filename, storedName, mimeType: file.mime, category: 'company_logo', size, uploadedBy: this.ctx.state.user.id })
  }

  async create(value, files) {
    if (await this.codeExists(value.code)) throw Object.assign(new Error('企业编码已存在，请更换'), { status: 400 })
    let logo = null
    let license = null
    try {
      logo = files.logo ? await this.saveLogo(files.logo) : null
      license = files.license ? await this.saveLicense(files.license) : null
      const item = await this.app.model.Company.create({ ...value, logoFileId: logo?.id || null, licenseFileId: license?.id || null, status: 'enabled', createdBy: this.ctx.state.user.id })
      await this.log('新增公司', item)
      return this.json(item)
    } catch (error) {
      for (const uploaded of [logo, license].filter(Boolean)) { await uploaded.destroy(); await this.ctx.service.storage.delete(uploaded.storedName).catch(() => {}) }
      throw error
    }
  }

  async update(id, value, files) {
    const item = await this.app.model.Company.findByPk(id)
    if (!item) return null
    if (await this.codeExists(value.code, id)) throw Object.assign(new Error('企业编码已存在，请更换'), { status: 400 })
    let logo = null
    let license = null
    try {
      logo = files.logo ? await this.saveLogo(files.logo) : null
      license = files.license ? await this.saveLicense(files.license) : null
      const oldLogoId = item.logoFileId
      const oldLicenseId = item.licenseFileId
      await item.update({ ...value, ...(logo ? { logoFileId: logo.id } : {}), ...(license ? { licenseFileId: license.id } : {}) })
      await this.log('修改公司', item)
      if (logo && oldLogoId) await this.removeFile(oldLogoId)
      if (license && oldLicenseId) await this.removeLicense(oldLicenseId)
      return this.json(item)
    } catch (error) {
      for (const uploaded of [logo, license].filter(Boolean)) { await uploaded.destroy(); await this.ctx.service.storage.delete(uploaded.storedName).catch(() => {}) }
      throw error
    }
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
    const logoId = item.logoFileId
    await this.log('删除公司', item)
    await item.destroy()
    if (licenseId) await this.removeLicense(licenseId)
    if (logoId) await this.removeFile(logoId)
    return { conflict: false }
  }

  async removeLicense(id) {
    return this.removeFile(id)
  }

  async removeFile(id) {
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

  async logo(id) {
    const item = await this.app.model.Company.findByPk(id, { include: [{ model: this.app.model.File, as: 'logoFile' }] })
    if (!item?.logoFile) return null
    const stream = await this.ctx.service.storage.getStream(item.logoFile.storedName)
    return stream ? { item: item.logoFile, stream } : null
  }
}

module.exports = CompaniesService
