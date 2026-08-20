import {
  getQrOverview,
  type QrMetrics,
  type QrOverviewFilters,
  type QrOverviewItem,
} from '@/api/qrcodes'
import { usePagedList } from '@/composables/usePagedList'

const defaultFilters = (): QrOverviewFilters => ({
  keyword: '',
  status: '',
})

const emptyMetrics = (): QrMetrics => ({
  total: 0,
  bound: 0,
  unbound: 0,
  activated: 0,
  voided: 0,
})

// 将二维码汇总指标与通用分页列表组合为一个页面状态。
export function useQrOverview() {
  const metrics = shallowRef<QrMetrics>(emptyMetrics())
  const list = usePagedList<QrOverviewItem, QrOverviewFilters>({
    createFilters: defaultFilters,
    async fetchPage(params) {
      const result = await getQrOverview(
        params as unknown as Record<string, string | number>,
      )
      // 指标与列表来自同一响应，保证两部分展示的是同一查询快照。
      metrics.value = result.metrics
      return result
    }
  })

  return {
    ...list,
    metrics: readonly(metrics),
  }
}
