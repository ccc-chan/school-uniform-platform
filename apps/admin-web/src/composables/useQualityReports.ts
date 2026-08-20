import {
  getQualityReports,
  type QualityReport,
} from '@/api/quality'
import { usePagedList } from '@/composables/usePagedList'

const defaultFilters = () => ({
  keyword: '',
  productId: '',
  status: '',
  startDate: '',
  endDate: '',
})

// 使用通用分页状态管理质量报告的关键词、产品、状态和日期筛选。
export function useQualityReports() {
  return usePagedList<QualityReport, ReturnType<typeof defaultFilters>>({
    createFilters: defaultFilters,
    fetchPage: params =>
      getQualityReports(params as unknown as Record<string, string | number>),
  })
}
