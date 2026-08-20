import { request } from '@/api/http'
import type { DashboardData } from '@/types/dashboard'

// 获取首页指标、扫码趋势、状态分布、动态和产品排行。
export function getDashboardOverview() {
  return request<DashboardData>('/api/v1/dashboard/overview')
}
