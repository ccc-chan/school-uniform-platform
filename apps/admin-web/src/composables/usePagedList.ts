import { reactive, readonly, shallowRef } from 'vue'

// 所有分页列表共用的页码和每页数量参数。
export interface PagedListParams {
  page: number
  pageSize: number
}

export interface PagedListResult<Item> {
  items: Item[]
  total: number
}

interface UsePagedListOptions<Item, Filters extends object> {
  createFilters: () => Filters
  fetchPage: (
    params: Filters & PagedListParams,
  ) => Promise<PagedListResult<Item>>
  initialPageSize?: number
}

/**
 * 通用分页列表状态机，统一加载、搜索、重置和翻页行为。
 * 列表状态只读暴露，调用方通过动作函数触发修改。
 */
export function usePagedList<Item, Filters extends object>(
  options: UsePagedListOptions<Item, Filters>,
) {
  const items = shallowRef<Item[]>([])
  const loading = shallowRef(false)
  const total = shallowRef(0)
  const page = shallowRef(1)
  const pageSize = shallowRef(options.initialPageSize ?? 10)
  const filters = reactive(options.createFilters()) as Filters

  async function load() {
    loading.value = true
    try {
      const result = await options.fetchPage({
        ...filters,
        page: page.value,
        pageSize: pageSize.value,
      } as Filters & PagedListParams)
      items.value = result.items
      total.value = result.total
    } finally {
      loading.value = false
    }
  }

  function setFilters(value: Partial<Filters>) {
    Object.assign(filters, value)
  }

  async function search() {
    // 新筛选条件从第一页开始，避免沿用旧结果中的高页码。
    page.value = 1
    await load()
  }

  async function reset() {
    // 重新调用工厂函数，确保数组或对象类型筛选项不会复用旧引用。
    Object.assign(filters, options.createFilters())
    page.value = 1
    await load()
  }

  async function setPage(value: number) {
    page.value = value
    await load()
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    total: readonly(total),
    page: readonly(page),
    pageSize: readonly(pageSize),
    filters,
    load,
    setFilters,
    search,
    reset,
    setPage,
  }
}
