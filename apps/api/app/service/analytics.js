'use strict'

const { createHmac } = require('node:crypto')
const { QueryTypes } = require('sequelize')
const { Service } = require('egg')

const DEVICE_LABELS = {
  mobile: '手机',
  tablet: '平板',
  desktop: '电脑',
  other: '其他',
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function percentageChange(current, previous) {
  if (!previous) return current ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/**
 * 聚合扫码指标，并记录消费者侧的公开扫码行为。
 */
class AnalyticsService extends Service {
  // 只允许预设时间范围，并同时计算等长的上一周期用于环比。
  range(query = {}) {
    const days = [7, 30, 90].includes(Number(query.range))
      ? Number(query.range)
      : 7
    const endDate = new Date()
    const startDate = startOfDay(endDate)
    startDate.setDate(startDate.getDate() - days + 1)
    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - days)
    const productId = Number(query.productId)
    return {
      days,
      startDate,
      endDate,
      previousStart,
      productId: Number.isInteger(productId) && productId > 0 ? productId : null,
    }
  }

  where(range, alias = 's') {
    return {
      sql: `${alias}.scanned_at >= :startDate AND ${alias}.scanned_at <= :endDate${range.productId ? ` AND ${alias}.product_id = :productId` : ''}`,
      replacements: {
        startDate: range.startDate,
        endDate: range.endDate,
        ...(range.productId ? { productId: range.productId } : {}),
      },
    }
  }

  async options() {
    const rows = await this.app.model.Product.findAll({
      where: { status: 'enabled' },
      attributes: ['id', 'code', 'name'],
      order: [['name', 'ASC']],
    })
    return {
      products: rows.map((item) => ({
        id: Number(item.id),
        code: item.code,
        name: item.name,
      })),
    }
  }

  async metricRows(range) {
    const current = this.where(range)
    const previous = {
      startDate: range.previousStart,
      endDate: range.startDate,
      ...(range.productId ? { productId: range.productId } : {}),
    }
    const productClause = range.productId ? ' AND product_id = :productId' : ''
    const [currentRow] = await this.app.model.query(
      `SELECT COUNT(*) AS scans,
        COUNT(DISTINCT visitor_hash) AS visitors,
        COUNT(DISTINCT product_id) AS products,
        COUNT(DISTINCT NULLIF(CONCAT_WS('/', province, city), '')) AS regions
      FROM qr_scan_records s WHERE ${current.sql}`,
      { replacements: current.replacements, type: QueryTypes.SELECT },
    )
    const [previousRow] = await this.app.model.query(
      `SELECT COUNT(*) AS scans, COUNT(DISTINCT visitor_hash) AS visitors
      FROM qr_scan_records
      WHERE scanned_at >= :startDate AND scanned_at < :endDate${productClause}`,
      { replacements: previous, type: QueryTypes.SELECT },
    )
    const scans = Number(currentRow?.scans || 0)
    const visitors = Number(currentRow?.visitors || 0)
    return {
      scans,
      visitors,
      products: Number(currentRow?.products || 0),
      regions: Number(currentRow?.regions || 0),
      avgDailyScans: Number((scans / range.days).toFixed(1)),
      scanChange: percentageChange(scans, Number(previousRow?.scans || 0)),
      visitorChange: percentageChange(
        visitors,
        Number(previousRow?.visitors || 0),
      ),
    }
  }

  async trend(range) {
    // SQL 仅返回有扫码的日期，响应阶段补齐无数据日期为零。
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT DATE(scanned_at) AS date, COUNT(*) AS scans,
        COUNT(DISTINCT visitor_hash) AS visitors
      FROM qr_scan_records s WHERE ${where.sql}
      GROUP BY DATE(scanned_at) ORDER BY date`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    const rowMap = new Map(rows.map((item) => [dateKey(new Date(item.date)), item]))
    return Array.from({ length: range.days }, (_, index) => {
      const date = new Date(range.startDate)
      date.setDate(date.getDate() + index)
      const key = dateKey(date)
      const item = rowMap.get(key)
      return {
        date: key,
        scans: Number(item?.scans || 0),
        visitors: Number(item?.visitors || 0),
      }
    })
  }

  async hourly(range) {
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT HOUR(scanned_at) AS hour, COUNT(*) AS scans
      FROM qr_scan_records s WHERE ${where.sql}
      GROUP BY HOUR(scanned_at) ORDER BY hour`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    const rowMap = new Map(rows.map((item) => [Number(item.hour), Number(item.scans)]))
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      scans: rowMap.get(hour) || 0,
    }))
  }

  async products(range, totalScans) {
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT p.id AS productId, p.code AS productCode, p.name AS productName,
        COUNT(*) AS scans, COUNT(DISTINCT s.visitor_hash) AS visitors,
        COUNT(DISTINCT s.qr_code_id) AS qrCount
      FROM qr_scan_records s
      LEFT JOIN prd_products p ON p.id = s.product_id
      WHERE ${where.sql}
      GROUP BY p.id, p.code, p.name
      ORDER BY scans DESC, productName ASC LIMIT 20`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    return rows.map((item) => ({
      productId: item.productId ? Number(item.productId) : null,
      productCode: item.productCode || '-',
      productName: item.productName || '未关联产品',
      scans: Number(item.scans || 0),
      visitors: Number(item.visitors || 0),
      qrCount: Number(item.qrCount || 0),
      share: totalScans
        ? Number(((Number(item.scans) / totalScans) * 100).toFixed(1))
        : 0,
    }))
  }

  async regions(range, totalScans) {
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT COALESCE(NULLIF(province, ''), '未知地区') AS province,
        COALESCE(NULLIF(city, ''), '未知城市') AS city,
        COUNT(*) AS scans, COUNT(DISTINCT visitor_hash) AS visitors
      FROM qr_scan_records s WHERE ${where.sql}
      GROUP BY province, city ORDER BY scans DESC, province, city LIMIT 30`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    return rows.map((item) => ({
      province: item.province,
      city: item.city,
      scans: Number(item.scans || 0),
      visitors: Number(item.visitors || 0),
      share: totalScans
        ? Number(((Number(item.scans) / totalScans) * 100).toFixed(1))
        : 0,
    }))
  }

  async devices(range, totalScans) {
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT device_type AS deviceType, COUNT(*) AS value
      FROM qr_scan_records s WHERE ${where.sql}
      GROUP BY device_type ORDER BY value DESC`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    return rows.map((item) => ({
      name: DEVICE_LABELS[item.deviceType] || DEVICE_LABELS.other,
      deviceType: item.deviceType,
      value: Number(item.value || 0),
      percent: totalScans
        ? Number(((Number(item.value) / totalScans) * 100).toFixed(1))
        : 0,
    }))
  }

  async recentScans(range) {
    const where = this.where(range)
    const rows = await this.app.model.query(
      `SELECT s.id, q.code AS qrCode, p.name AS productName,
        COALESCE(NULLIF(s.province, ''), '未知地区') AS province,
        COALESCE(NULLIF(s.city, ''), '未知城市') AS city,
        s.device_type AS deviceType, s.scanned_at AS scannedAt
      FROM qr_scan_records s
      JOIN qr_codes q ON q.id = s.qr_code_id
      LEFT JOIN prd_products p ON p.id = s.product_id
      WHERE ${where.sql}
      ORDER BY s.scanned_at DESC LIMIT 10`,
      { replacements: where.replacements, type: QueryTypes.SELECT },
    )
    return rows.map((item) => ({
      id: Number(item.id),
      qrCode: item.qrCode,
      productName: item.productName || '未关联产品',
      region: `${item.province} · ${item.city}`,
      device: DEVICE_LABELS[item.deviceType] || DEVICE_LABELS.other,
      scannedAt: this.ctx.helper.formatDateTime(item.scannedAt),
    }))
  }

  async overview(query) {
    const range = this.range(query)
    const metrics = await this.metricRows(range)
    // 各分析维度互不依赖，并行查询以缩短概览接口响应时间。
    const [trend, hourly, products, regions, devices, recentScans] =
      await Promise.all([
        this.trend(range),
        this.hourly(range),
        this.products(range, metrics.scans),
        this.regions(range, metrics.scans),
        this.devices(range, metrics.scans),
        this.recentScans(range),
      ])
    return {
      range: {
        days: range.days,
        startDate: dateKey(range.startDate),
        endDate: dateKey(range.endDate),
      },
      metrics,
      trend,
      hourly,
      products,
      regions,
      devices,
      recentScans,
    }
  }

  deviceType(value, userAgent) {
    if (['mobile', 'tablet', 'desktop', 'other'].includes(value)) return value
    if (/ipad|tablet/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|android/i.test(userAgent)) return 'mobile'
    if (userAgent) return 'desktop'
    return 'other'
  }

  visitorHash(visitorKey) {
    // 使用服务端密钥生成不可逆访客标识；无显式标识时按 IP、设备和日期聚合。
    const userAgent = this.ctx.get('user-agent') || ''
    const source = visitorKey || `${this.ctx.ip}|${userAgent}|${dateKey(new Date())}`
    return createHmac('sha256', this.app.config.keys).update(source).digest('hex')
  }

  async recordScan(code, value = {}) {
    // 已作废二维码不记录扫码，产品优先取二维码绑定值并回退到生成批次。
    const [item] = await this.app.model.query(
      `SELECT q.id AS qrCodeId, q.code, q.status,
        q.product_sku AS productSku,
        q.production_batch AS productionBatch,
        COALESCE(q.product_id, b.product_id) AS productId,
        p.code AS productCode, p.name AS productName,
        p.category, p.season, p.style, p.color,
        p.fabric_info AS fabricInfo,
        p.execution_standard AS executionStandard
      FROM qr_codes q
      JOIN qr_generation_batches b ON b.id = q.generation_batch_id
      LEFT JOIN prd_products p
        ON p.id = COALESCE(q.product_id, b.product_id)
      WHERE q.code = :code AND q.status <> 'voided' LIMIT 1`,
      { replacements: { code }, type: QueryTypes.SELECT },
    )
    if (!item) return null
    const deviceType = this.deviceType(value.deviceType, this.ctx.get('user-agent') || '')
    const record = await this.app.model.ScanRecord.create({
      qrCodeId: item.qrCodeId,
      productId: item.productId,
      visitorHash: this.visitorHash(value.visitorKey),
      province: String(value.province || '').trim().slice(0, 50),
      city: String(value.city || '').trim().slice(0, 50),
      deviceType,
      scannedAt: new Date(),
    })
    // 首次扫描只把已绑定二维码推进为已激活，重复扫描不会回退其他状态。
    await this.app.model.QrCode.update(
      { status: 'activated' },
      { where: { id: item.qrCodeId, status: 'bound' } },
    )
    return {
      code: item.code,
      status: item.status === 'bound' ? 'activated' : item.status,
      productCode: item.productCode || '',
      productName: item.productName || '',
      category: item.category || '',
      season: item.season || '',
      style: item.style || '',
      color: item.color || '',
      fabricInfo: item.fabricInfo || '',
      executionStandard: item.executionStandard || '',
      productionBatch: item.productionBatch || '',
      productSku: item.productSku || '',
      recorded: true,
      scannedAt: this.ctx.helper.formatDateTime(record.scannedAt),
    }
  }
}

module.exports = AnalyticsService
