export interface MetricItem {
  label: string
  value: number
  trend: string
  trendLabel: string
  color: string
  softColor: string
  symbol: string
}

export interface ScanPoint {
  date: string
  value: number
}

export interface QrStatusItem {
  name: string
  value: number
  percent: number
  color: string
}

export interface ActivityItem {
  id: number
  time: string
  operator: string
  action: string
  detail: string
  status: '成功' | '处理中'
}

export interface RankingItem {
  name: string
  scans: number
}

export interface DashboardData {
  metrics: MetricItem[]
  scanPoints: ScanPoint[]
  qrStatuses: QrStatusItem[]
  activities: ActivityItem[]
  rankings: RankingItem[]
}
