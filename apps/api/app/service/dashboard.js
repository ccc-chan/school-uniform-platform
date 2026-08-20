'use strict'

const { QueryTypes } = require('sequelize')
const { Service } = require('egg')

const QR_STATUS_PRESENTATION = [
  { status: 'unbound', name: '未绑定', color: '#60A5FA' },
  { status: 'bound', name: '已绑定', color: '#2563EB' },
  { status: 'activated', name: '已扫码', color: '#A78BFA' },
  { status: 'voided', name: '已作废', color: '#F97316' },
]

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function percentageChange(current, previous) {
  if (!previous) return current ? '+100%' : '0%'

  const value = Number((((current - previous) / previous) * 100).toFixed(1))
  return `${value > 0 ? '+' : ''}${value}%`
}

function parseDetail(value) {
  if (!value) return {}

  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

/**
 * 聚合首页指标、七日趋势、二维码状态、动态记录和产品排行。
 */
class DashboardService extends Service {
  activityDetail(row) {
    const detail = parseDetail(row.detail)
    const context = detail.context || {}
    const value =
      context.name ||
      context.batchNo ||
      context.reportNo ||
      context.code

    return value
      ? String(value)
      : `${row.module || '系统'} · ${row.targetType || '操作'}`
  }

  async overview() {
    // 五组统计互不依赖，使用并行查询避免串行等待。
    const [
      summaryRows,
      trendRows,
      statusRows,
      activityRows,
      rankingRows,
    ] = await Promise.all([
      this.app.model.query(
        `SELECT
          (
            SELECT COUNT(*)
            FROM qr_scan_records
            WHERE scanned_at >= CURDATE()
              AND scanned_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          ) AS todayScans,
          (
            SELECT COUNT(*)
            FROM qr_scan_records
            WHERE scanned_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
              AND scanned_at < CURDATE()
          ) AS yesterdayScans,
          (
            SELECT COUNT(*)
            FROM qr_codes
          ) AS qrTotal,
          (
            SELECT COUNT(*)
            FROM qr_codes
            WHERE created_at >= CURDATE()
              AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          ) AS todayQrCodes,
          (
            SELECT COUNT(*)
            FROM prd_products
          ) AS productTotal,
          (
            SELECT COUNT(*)
            FROM prd_products
            WHERE created_at >= CURDATE()
              AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          ) AS todayProducts,
          (
            SELECT COUNT(*)
            FROM quality_reports
          ) AS reportTotal,
          (
            SELECT COUNT(*)
            FROM quality_reports
            WHERE created_at >= CURDATE()
              AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          ) AS todayReports`,
        { type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT
          DATE_FORMAT(scanned_at, '%Y-%m-%d') AS date,
          COUNT(*) AS value
        FROM qr_scan_records
        WHERE scanned_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          AND scanned_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY DATE_FORMAT(scanned_at, '%Y-%m-%d')
        ORDER BY DATE_FORMAT(scanned_at, '%Y-%m-%d')`,
        { type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT status, COUNT(*) AS value
        FROM qr_codes
        GROUP BY status`,
        { type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT
          logs.id,
          logs.module,
          logs.action,
          logs.target_type AS targetType,
          logs.detail,
          logs.created_at AS createdAt,
          COALESCE(employees.name, '系统') AS operator
        FROM sys_operation_logs logs
        LEFT JOIN sys_employees employees
          ON employees.id = logs.employee_id
        ORDER BY logs.id DESC
        LIMIT 5`,
        { type: QueryTypes.SELECT },
      ),
      this.app.model.query(
        `SELECT
          products.name,
          COUNT(records.id) AS scans
        FROM qr_scan_records records
        JOIN prd_products products
          ON products.id = records.product_id
        GROUP BY products.id, products.name
        ORDER BY scans DESC, products.id DESC
        LIMIT 5`,
        { type: QueryTypes.SELECT },
      ),
    ])

    const summary = summaryRows[0] || {}
    const todayScans = Number(summary.todayScans || 0)
    const yesterdayScans = Number(summary.yesterdayScans || 0)
    const qrTotal = Number(summary.qrTotal || 0)

    const statusMap = new Map(
      statusRows.map((item) => [
        item.status,
        Number(item.value || 0),
      ]),
    )
    const boundTotal =
      (statusMap.get('bound') || 0) +
      (statusMap.get('activated') || 0)
    const trendMap = new Map(
      trendRows.map((item) => [
        String(item.date),
        Number(item.value || 0),
      ]),
    )

    // 数据库只返回有扫码的日期，前端图表需要连续七天，因此补齐零值。
    const scanPoints = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - 6 + index)
      const key = dateKey(date)

      return {
        date: key.slice(5),
        value: trendMap.get(key) || 0,
      }
    })

    return {
      metrics: [
        {
          label: '今日扫码次数',
          value: todayScans,
          trend: percentageChange(todayScans, yesterdayScans),
          trendLabel: '较昨日',
          color: '#2563EB',
          softColor: '#EAF2FF',
          symbol: '⌁',
        },
        {
          label: '二维码总数',
          value: qrTotal,
          trend: `+${Number(summary.todayQrCodes || 0)}`,
          trendLabel: '今日新增',
          color: '#14B8A6',
          softColor: '#E7F8F5',
          symbol: '⌗',
        },
        {
          label: '已绑定数量',
          value: boundTotal,
          trend: qrTotal
            ? `${((boundTotal / qrTotal) * 100).toFixed(1)}%`
            : '0%',
          trendLabel: '绑定率',
          color: '#F97316',
          softColor: '#FFF1E8',
          symbol: '⌛',
        },
        {
          label: '产品总数',
          value: Number(summary.productTotal || 0),
          trend: `+${Number(summary.todayProducts || 0)}`,
          trendLabel: '今日新增',
          color: '#8B5CF6',
          softColor: '#F1ECFF',
          symbol: '▣',
        },
        {
          label: '检测报告总数',
          value: Number(summary.reportTotal || 0),
          trend: `+${Number(summary.todayReports || 0)}`,
          trendLabel: '今日新增',
          color: '#3B82F6',
          softColor: '#EAF2FF',
          symbol: '♧',
        },
      ],
      scanPoints,
      qrStatuses: QR_STATUS_PRESENTATION.map((item) => {
        const value = statusMap.get(item.status) || 0

        return {
          name: item.name,
          value,
          percent: qrTotal
            ? Number(((value / qrTotal) * 100).toFixed(1))
            : 0,
          color: item.color,
        }
      }),
      activities: activityRows.map((item) => ({
        id: Number(item.id),
        time: this.ctx.helper.formatDateTime(item.createdAt),
        operator: item.operator,
        action: item.action,
        detail: this.activityDetail(item),
        status: '成功',
      })),
      rankings: rankingRows.map((item) => ({
        name: item.name,
        scans: Number(item.scans || 0),
      })),
    }
  }
}

module.exports = DashboardService
