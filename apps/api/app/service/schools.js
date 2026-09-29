'use strict'

const { Op } = require('sequelize')
const { Service } = require('egg')

const schoolTypes = new Set([
  '幼儿园',
  '小学',
  '初中',
  '高中',
  '中职',
  '高等学校',
  '特殊教育',
  '专门学校',
])

class SchoolsService extends Service {
  json(item) {
    return {
      id: Number(item.id),
      code: item.code,
      name: item.name,
      schoolType: item.schoolType,
      address: item.address || '',
    }
  }

  async list(query) {
    const { page, pageSize, offset } = this.ctx.helper.pagination(query, {
      defaultPageSize: 20,
      maxPageSize: 50,
    })
    const where = { status: 'enabled' }
    if (schoolTypes.has(query.schoolType)) where.schoolType = query.schoolType
    if (query.keyword) {
      where[Op.or] = ['name', 'code'].map((field) => ({
        [field]: { [Op.substring]: query.keyword },
      }))
    }
    const { rows, count } = await this.app.model.School.findAndCountAll({
      where,
      order: [['name', 'ASC'], ['id', 'ASC']],
      limit: pageSize,
      offset,
    })
    return {
      items: rows.map((item) => this.json(item)),
      total: count,
      page,
      pageSize,
      hasMore: offset + rows.length < count,
    }
  }

  async enabled(ids, transaction) {
    const normalized = [...new Set(ids.map(Number))]
    if (!normalized.length) return []
    if (normalized.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      throw Object.assign(new Error('学校参数无效'), { status: 400 })
    }
    const rows = await this.app.model.School.findAll({
      where: { id: { [Op.in]: normalized }, status: 'enabled' },
      order: [['name', 'ASC']],
      transaction,
    })
    if (rows.length !== normalized.length) {
      throw Object.assign(new Error('所选学校不存在或已停用'), { status: 400 })
    }
    return rows
  }
}

module.exports = SchoolsService
