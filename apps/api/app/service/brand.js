'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { Op } = require('sequelize')
const { Service } = require('egg')

const assetTypes = new Set(['story', 'factory', 'video'])
const statuses = new Set(['enabled', 'disabled'])
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const profileFieldPermissions = {
  name: 'brand.field.name',
  logoFileId: 'brand.field.logo',
  logoFileName: 'brand.field.logo',
  introduction: 'brand.field.introduction',
  website: 'brand.field.website',
  phone: 'brand.field.phone',
}
const typeLabels = {
  story: '品牌故事',
  factory: '工厂展示',
  video: '视频资料',
}

function invalid(message, status = 400) {
  const error = new Error(message)
  error.status = status
  throw error
}

function required(value, label, max = 255) {
  const text = String(value || '').trim()
  if (!text) invalid(`请填写${label}`)
  if (text.length > max) invalid(`${label}不能超过 ${max} 个字符`)
  return text
}

function optional(value, max) {
  return String(value || '').trim().slice(0, max)
}

function normalizeType(value) {
  const type = String(value || '')
  if (!assetTypes.has(type)) invalid('品牌内容类型无效', 404)
  return type
}

function fileByField(files, fieldname) {
  return files.find((file) => file.fieldname === fieldname) || null
}

/**
 * 管理品牌主页和品牌内容，并协调数据库记录与磁盘媒体文件。
 */
class BrandService extends Service {
  profileInclude() {
    return [{
      model: this.app.model.File,
      as: 'logoFile',
      attributes: ['id', 'originalName'],
    }]
  }

  assetInclude() {
    return [
      {
        model: this.app.model.File,
        as: 'coverFile',
        attributes: ['id', 'originalName', 'mimeType'],
      },
      {
        model: this.app.model.File,
        as: 'mediaFile',
        attributes: ['id', 'originalName', 'mimeType'],
      },
    ]
  }

  // 权限存在时删除无权查看的品牌字段，而不是仅依赖前端隐藏。
  profileJson(item, permissions = null) {
    const data = item
      ? {
          id: Number(item.id),
          name: item.name,
          logoFileId: item.logoFileId ? Number(item.logoFileId) : null,
          logoFileName: item.logoFile?.originalName || '',
          introduction: item.introduction || '',
          website: item.website || '',
          phone: item.phone || '',
          updatedAt: this.ctx.helper.formatDateTime(item.updatedAt),
        }
      : {
          id: null,
          name: '',
          logoFileId: null,
          logoFileName: '',
          introduction: '',
          website: '',
          phone: '',
          updatedAt: '-',
        }

    if (permissions) {
      for (const [key, permission] of Object.entries(profileFieldPermissions)) {
        if (!permissions.includes(permission)) delete data[key]
      }
    }
    return data
  }

  assetJson(item) {
    return {
      id: Number(item.id),
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || '',
      content: item.content || '',
      location: item.location || '',
      coverFileId: item.coverFileId ? Number(item.coverFileId) : null,
      coverFileName: item.coverFile?.originalName || '',
      mediaFileId: item.mediaFileId ? Number(item.mediaFileId) : null,
      mediaFileName: item.mediaFile?.originalName || '',
      sort: Number(item.sort || 0),
      status: item.status,
      updatedAt: this.ctx.helper.formatDateTime(item.updatedAt),
    }
  }

  async log(action, targetType, targetId, context = null, transaction = null) {
    const log = await this.app.model.OperationLog.create({
      employeeId: this.ctx.state.user?.id || null,
      module: '品牌中心',
      action,
      targetType,
      targetId,
      detail: {
        request: {
          method: this.ctx.method,
          path: this.ctx.path,
          params: this.ctx.params,
          query: this.ctx.query,
          body: this.ctx.request.body,
          files: (this.ctx.request.files || []).map((file) => ({
            name: file.filename,
            mimeType: file.mime,
          })),
        },
        response: null,
        context,
      },
      ip: this.ctx.ip,
    }, { transaction })
    this.ctx.state.operationLogIds ||= []
    this.ctx.state.operationLogIds.push(Number(log.id))
  }

  validateWebsite(value) {
    const website = optional(value, 255)
    if (!website) return ''
    try {
      const parsed = new URL(website)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
    } catch {
      invalid('官方网站地址格式不正确')
    }
    return website
  }

  // 文件类型和体积验证通过后，以随机文件名保存并创建文件元数据。
  async storeFile(file, category, transaction) {
    const isImage = category === 'brand_image'
    const allowed = isImage ? imageTypes : videoTypes
    const maxSize = (isImage ? 10 : 200) * 1024 * 1024
    if (!allowed.has(file.mime)) {
      invalid(isImage
        ? '仅支持 JPG、PNG、WEBP 图片'
        : '仅支持 MP4、WEBM、MOV 视频')
    }
    const size = (await fsp.stat(file.filepath)).size
    if (size > maxSize) {
      invalid(isImage ? '图片不能超过 10MB' : '视频不能超过 200MB')
    }

    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    }
    const storedName = `${crypto.randomUUID()}${extensions[file.mime]}`
    const uploadDir = path.join(this.app.baseDir, 'storage', 'uploads')
    const targetPath = path.join(uploadDir, storedName)
    await fsp.mkdir(uploadDir, { recursive: true })
    await fsp.copyFile(file.filepath, targetPath)
    const item = await this.app.model.File.create({
      originalName: file.filename,
      storedName,
      mimeType: file.mime,
      category,
      size,
      uploadedBy: this.ctx.state.user.id,
    }, { transaction })
    return { item, targetPath }
  }

  // 只允许删除品牌分类文件，避免误删其他模块复用的文件记录。
  async removeFile(id) {
    if (!id) return
    const item = await this.app.model.File.findByPk(id)
    if (!item || !['brand_image', 'brand_video'].includes(item.category)) return
    await item.destroy()
    await fsp.unlink(
      path.join(this.app.baseDir, 'storage', 'uploads', item.storedName),
    ).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }

  async getProfile(permissions = null) {
    const item = await this.app.model.BrandProfile.findByPk(1, {
      include: this.profileInclude(),
    })
    return this.profileJson(item, permissions)
  }

  // 磁盘写入不受数据库事务控制，storedFiles 用于失败后的补偿清理。
  async updateProfile(value, files) {
    const payload = {
      name: required(value.name, '品牌名称', 120),
      introduction: required(value.introduction, '品牌介绍', 5000),
      website: this.validateWebsite(value.website),
      phone: optional(value.phone, 30),
      updatedBy: this.ctx.state.user.id,
    }
    const logo = fileByField(files, 'logo')
    const storedFiles = []
    let oldLogoId = null

    try {
      const profileId = await this.app.model.transaction(async (transaction) => {
        let item = await this.app.model.BrandProfile.findByPk(1, { transaction })
        oldLogoId = item?.logoFileId ? Number(item.logoFileId) : null
        const storedLogo = logo
          ? await this.storeFile(logo, 'brand_image', transaction)
          : null
        if (storedLogo) storedFiles.push(storedLogo)
        const values = {
          ...payload,
          ...(storedLogo ? { logoFileId: storedLogo.item.id } : {}),
        }
        if (item) await item.update(values, { transaction })
        else item = await this.app.model.BrandProfile.create(
          { id: 1, ...values },
          { transaction },
        )
        await this.log('保存品牌资料', 'brand_profile', item.id, {
          name: item.name,
          logoUpdated: Boolean(storedLogo),
        }, transaction)
        return Number(item.id)
      })

      if (logo && oldLogoId) await this.removeFile(oldLogoId)
      const item = await this.app.model.BrandProfile.findByPk(profileId, {
        include: this.profileInclude(),
      })
      return this.profileJson(item)
    } catch (error) {
      await Promise.all(
        storedFiles.map(({ targetPath }) =>
          fsp.unlink(targetPath).catch(() => undefined),
        ),
      )
      throw error
    }
  }

  // 不同品牌内容类型共享基础字段，并在这里处理各自的必填规则。
  assetPayload(type, value) {
    const payload = {
      title: required(
        value.title,
        type === 'factory' ? '工厂名称' : type === 'video' ? '视频标题' : '故事标题',
        160,
      ),
      subtitle: optional(value.subtitle, 255),
      content: optional(value.content, 10000),
      location: type === 'factory' ? required(value.location, '所在地区', 160) : '',
      sort: Math.max(0, Math.min(9999, Number(value.sort || 0) || 0)),
      status: statuses.has(value.status) ? value.status : 'enabled',
      updatedBy: this.ctx.state.user.id,
    }
    if (type !== 'video' && !payload.content) {
      invalid(type === 'story' ? '请填写故事正文' : '请填写生产能力介绍')
    }
    return payload
  }

  assetWhere(type, query) {
    const where = { type }
    const keyword = String(query.keyword || '').trim()
    if (keyword) {
      where[Op.or] = ['title', 'subtitle', 'content', 'location'].map(
        (key) => ({ [key]: { [Op.like]: `%${keyword}%` } }),
      )
    }
    if (query.status) where.status = String(query.status)
    return where
  }

  async listAssets(value, query) {
    const type = normalizeType(value)
    const { page, pageSize, offset } =
      this.ctx.helper.pagination(query)
    const { rows, count } = await this.app.model.BrandAsset.findAndCountAll({
      where: this.assetWhere(type, query),
      include: this.assetInclude(),
      distinct: true,
      order: [['sort', 'ASC'], ['id', 'DESC']],
      limit: pageSize,
      offset,
    })
    return {
      items: rows.map((item) => this.assetJson(item)),
      total: count,
      page,
      pageSize,
    }
  }

  async getAsset(type, id) {
    const item = await this.app.model.BrandAsset.findOne({
      where: { id, type },
      include: this.assetInclude(),
    })
    return item ? this.assetJson(item) : null
  }

  // 数据记录和审计日志位于同一事务；事务失败时额外删除已写入磁盘的文件。
  async createAsset(value, input, files) {
    const type = normalizeType(value)
    const payload = this.assetPayload(type, input)
    const cover = fileByField(files, 'cover')
    const media = fileByField(files, 'media')
    if (type === 'video' && !media) invalid('请上传视频文件')
    const storedFiles = []

    try {
      const id = await this.app.model.transaction(async (transaction) => {
        const storedCover = cover
          ? await this.storeFile(cover, 'brand_image', transaction)
          : null
        if (storedCover) storedFiles.push(storedCover)
        const storedMedia = type === 'video' && media
          ? await this.storeFile(media, 'brand_video', transaction)
          : null
        if (storedMedia) storedFiles.push(storedMedia)
        const item = await this.app.model.BrandAsset.create({
          ...payload,
          type,
          coverFileId: storedCover?.item.id || null,
          mediaFileId: storedMedia?.item.id || null,
          createdBy: this.ctx.state.user.id,
        }, { transaction })
        await this.log(`新增${typeLabels[type]}`, 'brand_asset', item.id, {
          type,
          title: item.title,
        }, transaction)
        return Number(item.id)
      })
      return this.getAsset(type, id)
    } catch (error) {
      await Promise.all(
        storedFiles.map(({ targetPath }) =>
          fsp.unlink(targetPath).catch(() => undefined),
        ),
      )
      throw error
    }
  }

  // 新文件保存成功后才删除旧文件，避免更新失败造成现有媒体丢失。
  async updateAsset(value, id, input, files) {
    const type = normalizeType(value)
    const existing = await this.app.model.BrandAsset.findOne({ where: { id, type } })
    if (!existing) return null
    const payload = this.assetPayload(type, input)
    const cover = fileByField(files, 'cover')
    const media = fileByField(files, 'media')
    const oldCoverId = existing.coverFileId ? Number(existing.coverFileId) : null
    const oldMediaId = existing.mediaFileId ? Number(existing.mediaFileId) : null
    const storedFiles = []

    try {
      await this.app.model.transaction(async (transaction) => {
        const item = await this.app.model.BrandAsset.findOne({
          where: { id, type },
          transaction,
        })
        const storedCover = cover
          ? await this.storeFile(cover, 'brand_image', transaction)
          : null
        if (storedCover) storedFiles.push(storedCover)
        const storedMedia = type === 'video' && media
          ? await this.storeFile(media, 'brand_video', transaction)
          : null
        if (storedMedia) storedFiles.push(storedMedia)
        await item.update({
          ...payload,
          ...(storedCover ? { coverFileId: storedCover.item.id } : {}),
          ...(storedMedia ? { mediaFileId: storedMedia.item.id } : {}),
        }, { transaction })
        await this.log(`编辑${typeLabels[type]}`, 'brand_asset', item.id, {
          type,
          title: item.title,
          coverUpdated: Boolean(storedCover),
          mediaUpdated: Boolean(storedMedia),
        }, transaction)
      })

      if (cover && oldCoverId) await this.removeFile(oldCoverId)
      if (media && oldMediaId) await this.removeFile(oldMediaId)
      return this.getAsset(type, id)
    } catch (error) {
      await Promise.all(
        storedFiles.map(({ targetPath }) =>
          fsp.unlink(targetPath).catch(() => undefined),
        ),
      )
      throw error
    }
  }

  async updateAssetStatus(value, id, status) {
    const type = normalizeType(value)
    if (!statuses.has(status)) invalid('状态值无效')
    const item = await this.app.model.BrandAsset.findOne({ where: { id, type } })
    if (!item) return null
    const before = item.status
    await item.update({ status, updatedBy: this.ctx.state.user.id })
    await this.log(`更新${typeLabels[type]}状态`, 'brand_asset', item.id, {
      type,
      title: item.title,
      before,
      status,
    })
    return this.getAsset(type, id)
  }

  async deleteAsset(value, id) {
    const type = normalizeType(value)
    const item = await this.app.model.BrandAsset.findOne({ where: { id, type } })
    if (!item) return null
    const coverFileId = item.coverFileId ? Number(item.coverFileId) : null
    const mediaFileId = item.mediaFileId ? Number(item.mediaFileId) : null
    await this.app.model.transaction(async (transaction) => {
      await this.log(`删除${typeLabels[type]}`, 'brand_asset', item.id, {
        type,
        title: item.title,
      }, transaction)
      await item.destroy({ transaction })
    })
    await Promise.all([
      this.removeFile(coverFileId),
      this.removeFile(mediaFileId),
    ])
    return true
  }

  // 仅开放品牌图片和视频分类，并在创建读取流前确认物理文件存在。
  async getMedia(id) {
    const item = await this.app.model.File.findOne({
      where: {
        id,
        category: { [Op.in]: ['brand_image', 'brand_video'] },
      },
    })
    if (!item) return null
    const target = path.join(
      this.app.baseDir,
      'storage',
      'uploads',
      item.storedName,
    )
    try {
      await fsp.access(target)
    } catch {
      return null
    }
    return { item, stream: fs.createReadStream(target) }
  }
}

module.exports = BrandService
