import { message } from 'ant-design-vue'
import {
  getAnalyticsOptions,
  getAnalyticsOverview,
  type AnalyticsOptions,
  type AnalyticsOverview,
} from '@/api/analytics'

// 每次创建独立空对象，避免多个组件实例共享可变数组。
const emptyOverview = (): AnalyticsOverview => ({
  range: { days: 7, startDate: '', endDate: '' },
  metrics: {
    scans: 0,
    visitors: 0,
    products: 0,
    regions: 0,
    avgDailyScans: 0,
    scanChange: 0,
    visitorChange: 0,
  },
  trend: [],
  hourly: [],
  products: [],
  regions: [],
  devices: [],
  recentScans: [],
})

/**
 * 管理分析筛选条件、概览数据、筛选选项和加载状态。
 */
export function useAnalytics() {
  const filters = reactive<{ range: number; productId?: number }>({ range: 7 })
  const overview = shallowRef<AnalyticsOverview>(emptyOverview())
  const options = shallowRef<AnalyticsOptions>({ products: [] })
  const loading = shallowRef(false)

  async function load() {
    loading.value = true
    try {
      overview.value = await getAnalyticsOverview(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '统计数据加载失败')
    } finally {
      loading.value = false
    }
  }

  async function loadOptions() {
    try {
      options.value = await getAnalyticsOptions()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '筛选项加载失败')
    }
  }

  watch(
    // 时间范围或产品变化时自动刷新概览，immediate 同时完成首次加载。
    () => [filters.range, filters.productId] as const,
    () => load(),
    { immediate: true },
  )
  // 产品选项只需在组件挂载时加载一次。
  onMounted(loadOptions)

  return {
    filters,
    overview,
    options,
    loading,
    load,
  }
}
