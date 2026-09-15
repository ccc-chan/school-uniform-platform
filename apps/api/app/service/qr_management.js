'use strict'

const { Service } = require('egg')
const { QueryTypes } = require('sequelize')

// 学生绑定与产品绑定独立；已激活沿用二维码现有的扫码状态。
const joins = `FROM qr_codes q
  LEFT JOIN qr_generation_batches g ON g.id = q.generation_batch_id
  LEFT JOIN prd_products p ON p.id = COALESCE(q.product_id, g.product_id)
  LEFT JOIN qr_student_bindings b ON b.qr_code_id = q.id`
const statusSql = `CASE WHEN q.status = 'voided' THEN 'voided'
  WHEN q.disabled = 1 THEN 'disabled'
  WHEN q.status = 'activated' THEN 'activated'
  WHEN b.qr_code_id IS NOT NULL THEN 'bound' ELSE 'unbound' END`
const itemFields = `q.id, q.code, q.status AS qrStatus, q.disabled,
  p.name AS productName, p.code AS productCode, q.product_sku AS productSku,
  q.production_batch AS productionBatch, p.sizes AS productSizes,
  b.school_name AS schoolName, b.class_name AS className,
  b.student_name AS studentName, b.student_gender AS studentGender,
  b.grade, b.student_no AS studentNo, b.parent_name AS parentName,
  b.parent_relation AS parentRelation,
  CASE WHEN CHAR_LENGTH(b.phone) = 11
    THEN CONCAT(LEFT(b.phone, 3), '****', RIGHT(b.phone, 4)) ELSE NULL END AS phoneMasked,
  COALESCE(b.version, 0) AS version, (${statusSql}) AS status`

function itemJson(item) {
  return { ...item, id: Number(item.id), disabled: Boolean(item.disabled),
    version: Number(item.version), scanCount: Number(item.scanCount) }
}

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status })
}

class QrManagementService extends Service {
  select(sql, replacements = {}) {
    return this.app.model.query(sql, { replacements, type: QueryTypes.SELECT })
  }

  async list(query) {
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const clauses = ['1 = 1']
    const params = {}
    // LOCATE 按字面片段匹配；用户输入的 % 和 _ 不会变成通配符。
    for (const [key, column] of [['code', 'q.code'], ['studentName', 'b.student_name'], ['phone', 'b.phone']]) {
      if (!query[key]) continue
      clauses.push(`LOCATE(:${key}, ${column}) > 0`)
      params[key] = query[key]
    }
    if (query.schoolName) {
      clauses.push('b.school_name = :schoolName')
      params.schoolName = query.schoolName
    }
    if (query.status) {
      clauses.push(`(${statusSql}) = :status`)
      params.status = query.status
    }
    const where = `WHERE ${clauses.join(' AND ')}`
    const chinaDay = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
    const start = new Date(`${chinaDay}T00:00:00+08:00`)
    const end = new Date(start.getTime() + 86400000)
    const [items, counts, totals, scans, schools] = await Promise.all([
      this.select(`SELECT ${itemFields},
        (SELECT COUNT(*) FROM qr_scan_records s WHERE s.qr_code_id = q.id) AS scanCount
        ${joins} ${where} ORDER BY q.id DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit: pageSize, offset }),
      this.select(`SELECT COUNT(*) AS total ${joins} ${where}`, params),
      this.select(`SELECT COUNT(*) AS total,
        COALESCE(SUM(b.qr_code_id IS NOT NULL AND q.status <> 'voided' AND q.disabled = 0), 0) AS bound,
        COALESCE(SUM(q.status = 'activated' AND q.disabled = 0), 0) AS activated ${joins}`),
      this.select('SELECT COUNT(*) AS total FROM qr_scan_records WHERE scanned_at >= :start AND scanned_at < :end', { start, end }),
      this.select('SELECT DISTINCT school_name AS name FROM qr_student_bindings ORDER BY school_name'),
    ])
    return {
      items: items.map(itemJson),
      total: Number(counts[0].total), page, pageSize,
      statistics: {
        total: Number(totals[0].total), bound: Number(totals[0].bound),
        activated: Number(totals[0].activated), todayScans: Number(scans[0].total),
      },
      schools: schools.map((item) => item.name),
    }
  }

  async detail(id) {
    const [item] = await this.select(`SELECT ${itemFields},
      p.style, p.color, q.created_at AS generatedAt, b.created_at AS studentBoundAt,
      pb.production_date AS productionDate, pb.factory_name AS factoryName,
      (SELECT CASE WHEN COUNT(*) = 1 THEN MAX(name) ELSE NULL END FROM brand_profiles) AS brandName,
      EXISTS(SELECT 1 FROM quality_reports r JOIN sys_files f ON f.id = r.file_id
        WHERE r.product_id = p.id) AS hasQualityReport,
      (SELECT COUNT(*) FROM qr_scan_records s WHERE s.qr_code_id = q.id) AS scanCount,
      (SELECT MIN(scanned_at) FROM qr_scan_records s WHERE s.qr_code_id = q.id) AS firstScannedAt,
      (SELECT MAX(scanned_at) FROM qr_scan_records s WHERE s.qr_code_id = q.id) AS lastScannedAt
      ${joins}
      LEFT JOIN production_batches pb ON pb.batch_no = q.production_batch
        AND pb.product_id = COALESCE(q.product_id, g.product_id)
      WHERE q.id = :id LIMIT 1`, { id })
    if (!item) fail('二维码不存在', 404)
    const result = { ...itemJson(item), hasQualityReport: Boolean(item.hasQualityReport) }
    for (const key of ['generatedAt', 'studentBoundAt', 'firstScannedAt', 'lastScannedAt']) {
      result[key] = item[key] ? this.ctx.helper.formatDateTime(item[key]) : null
    }
    return result
  }

  async setDisabled(id, value) {
    return this.app.model.transaction(async (transaction) => {
      const qr = await this.app.model.QrCode.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
      if (!qr) fail('二维码不存在', 404)
      if (qr.status === 'voided') fail('已作废二维码不能停用或恢复')
      if (Boolean(qr.disabled) !== value.expectedDisabled) fail('二维码状态已变更，请刷新后重试', 409)
      if (Boolean(qr.disabled) !== value.disabled) {
        await qr.update({ disabled: value.disabled }, { transaction })
        await this.ctx.service.qrcodes.log(value.disabled ? '停用二维码' : '恢复二维码',
          'qr_code', id, { code: qr.code, disabled: value.disabled }, transaction)
      }
      return { id, disabled: value.disabled }
    })
  }

  async save(id, value) {
    return this.app.model.transaction(async (transaction) => {
      // 所有学生绑定写操作先锁定二维码，避免首次绑定并发覆盖。
      const qr = await this.app.model.QrCode.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
      if (!qr) fail('二维码不存在', 404)
      if (qr.status === 'voided') fail('已作废二维码不能绑定学生')
      if (qr.disabled) fail('请先恢复二维码，再编辑学生绑定')
      const existing = await this.app.model.QrStudentBinding.findByPk(id, { transaction })
      const permission = existing ? 'edit' : 'create'
      if (!(await this.ctx.service.auth.hasPermission(this.ctx.state.user.id, permission))) {
        fail('无权执行该操作', 403)
      }
      if (Number(existing?.version || 0) !== value.version) {
        fail('绑定信息已被其他人修改，请刷新列表后重试', 409)
      }
      if (!existing && !value.phone) fail('首次绑定必须填写手机号')
      const payload = {
        schoolName: value.schoolName, className: value.className,
        studentName: value.studentName, parentName: value.parentName,
        studentGender: value.studentGender || null, grade: value.grade || null,
        studentNo: value.studentNo || null, parentRelation: value.parentRelation || null,
        version: value.version + 1,
        ...(value.phone ? { phone: value.phone } : {}),
      }
      if (existing) await existing.update(payload, { transaction })
      else await this.app.model.QrStudentBinding.create({ qrCodeId: id, ...payload }, { transaction })
      // 操作日志只记录二维码标识，避免将手机号写入可浏览的日志详情。
      await this.ctx.service.qrcodes.log(
        existing ? '编辑学生绑定' : '绑定学生', 'qr_code', id,
        { code: qr.code }, transaction,
      )
      return { id }
    })
  }

  async scans(id, query) {
    if (!(await this.app.model.QrCode.findByPk(id, { attributes: ['id'] }))) fail('二维码不存在', 404)
    const { page, pageSize, offset } = this.ctx.helper.pagination(query)
    const chinaDay = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
    const start = new Date(`${chinaDay}T00:00:00+08:00`)
    const end = new Date(start.getTime() + 86400000)
    const baseSql = `FROM (
      SELECT s.id, q.code, b.student_name AS studentName, s.scanned_at AS scannedAt,
        ROW_NUMBER() OVER (PARTITION BY s.qr_code_id ORDER BY s.scanned_at, s.id) AS scanIndex,
        ROW_NUMBER() OVER (PARTITION BY s.qr_code_id, s.visitor_hash ORDER BY s.scanned_at, s.id) AS visitorScanIndex
      FROM qr_scan_records s
      JOIN qr_codes q ON q.id = s.qr_code_id
      LEFT JOIN qr_student_bindings b ON b.qr_code_id = s.qr_code_id
      WHERE s.qr_code_id = :id
    ) r`
    const classify = `CASE
      WHEN r.studentName IS NULL THEN '未绑定扫码'
      WHEN r.visitorScanIndex > 1 THEN '重复扫码'
      WHEN r.scanIndex = 1 THEN '首次扫码'
      ELSE '家长扫码' END`
    const [items, counts] = await Promise.all([
      this.select(`SELECT r.id, r.code, r.studentName, r.scannedAt, ${classify} AS scanType ${baseSql}
        ORDER BY r.scannedAt DESC, r.id DESC LIMIT :limit OFFSET :offset`, { id, limit: pageSize, offset }),
      this.select(`SELECT COUNT(*) AS total,
        COALESCE(SUM(r.scannedAt >= :start AND r.scannedAt < :end), 0) AS todayScans,
        COALESCE(SUM(${classify} = '重复扫码'), 0) AS duplicateScans,
        COALESCE(SUM(${classify} = '未绑定扫码'), 0) AS abnormalScans ${baseSql}`,
      { id, start, end }),
    ])
    const total = Number(counts[0].total)
    const duplicateScans = Number(counts[0].duplicateScans)
    const abnormalScans = Number(counts[0].abnormalScans)
    return {
      items: items.map((item) => ({
        id: Number(item.id), code: item.code, studentName: item.studentName,
        scanType: item.scanType, scannedAt: this.ctx.helper.formatDateTime(item.scannedAt),
      })),
      total, page, pageSize,
      summary: {
        todayScans: Number(counts[0].todayScans),
        normalScans: total - duplicateScans - abnormalScans,
        duplicateScans, abnormalScans,
      },
    }
  }
}

module.exports = QrManagementService
