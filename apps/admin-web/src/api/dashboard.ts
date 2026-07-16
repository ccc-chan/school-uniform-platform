import { request } from '@/api/http'
import type { DashboardData } from '@/types/dashboard'

export function getDashboardOverview() {
  return request<DashboardData>('/api/v1/dashboard/overview')
}
