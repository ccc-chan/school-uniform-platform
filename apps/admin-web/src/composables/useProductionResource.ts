import {
  createProductionItem,
  getProductionList,
  updateProductionItem,
  updateProductionStatus,
  type ProductionInput,
  type ProductionItem,
  type ProductionResource,
} from '@/api/production'
import { usePagedList } from '@/composables/usePagedList'
import type { MaybeRef } from 'vue'

const defaultFilters = () => ({ keyword: '', status: '' })

/**
 * 把通用分页列表适配为生产资源 CRUD。
 * resource 支持 ref，使同一页面组件可切换不同生产资源。
 */
export function useProductionResource(resource: MaybeRef<ProductionResource>) {
  const list = usePagedList<
    ProductionItem,
    ReturnType<typeof defaultFilters>
  >({
    createFilters: defaultFilters,
    fetchPage: params =>
      getProductionList(
        toValue(resource),
        params as unknown as Record<string, string | number>,
      ),
  })
  const { load } = list

  async function save(id: number | null, data: ProductionInput) {
    // 是否存在 ID 决定创建或更新，成功后重新加载当前页。
    if (id) await updateProductionItem(toValue(resource), id, data)
    else await createProductionItem(toValue(resource), data)
    await load()
  }

  async function changeStatus(id: number, status: string) {
    await updateProductionStatus(toValue(resource), id, status)
    await load()
  }

  return {
    ...list,
    save,
    changeStatus,
  }
}
