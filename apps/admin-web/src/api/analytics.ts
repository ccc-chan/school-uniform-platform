import { request } from '@/api/http'

// 数据分析接口及趋势、地区、产品、设备等响应类型。
export interface AnalyticsProductOption {
  id: number
  code: string
  name: string
}

export interface AnalyticsOptions {
  products: AnalyticsProductOption[]
}

export interface AnalyticsMetrics {
  scans: number
  visitors: number
  products: number
  regions: number
  avgDailyScans: number
  scanChange: number
  visitorChange: number
}

export interface AnalyticsTrendPoint {
  date: string
  scans: number
  visitors: number
}

export interface AnalyticsHourlyPoint {
  hour: number
  scans: number
}

export interface AnalyticsProductItem {
  productId: number | null
  productCode: string
  productName: string
  scans: number
  visitors: number
  qrCount: number
  share: number
}

export interface AnalyticsRegionItem {
  province: string
  city: string
  scans: number
  visitors: number
  share: number
}

export interface AnalyticsDeviceItem {
  name: string
  deviceType: string
  value: number
  percent: number
}

export interface RecentScanItem {
  id: number
  qrCode: string
  productName: string
  region: string
  device: string
  scannedAt: string
}

export interface AnalyticsOverview {
  range: { days: number; startDate: string; endDate: string }
  metrics: AnalyticsMetrics
  trend: AnalyticsTrendPoint[]
  hourly: AnalyticsHourlyPoint[]
  products: AnalyticsProductItem[]
  regions: AnalyticsRegionItem[]
  devices: AnalyticsDeviceItem[]
  recentScans: RecentScanItem[]
}

export interface AnalyticsQuery {
  range: number
  productId?: number
}

export function getAnalyticsOptions() {
  return request<AnalyticsOptions>('/api/v1/analytics/options')
}

export function getAnalyticsOverview(query: AnalyticsQuery) {
  const params = new URLSearchParams({ range: String(query.range) })
  if (query.productId) params.set('productId', String(query.productId))
  return request<AnalyticsOverview>(`/api/v1/analytics/overview?${params}`)
}
