import {
  deleteProduct,
  getProducts,
  updateProductStatus,
} from '@/api/products'
import type {
  Product,
  ProductFilters,
} from '@/api/products'
import { usePagedList } from '@/composables/usePagedList'

const defaultFilters = (): ProductFilters => ({
  keyword: '',
  category: '',
  qrCodeType: '',
  status: '',
})

// 管理产品分页列表，以及状态切换和删除后的列表同步。
export function useProducts() {
  const list = usePagedList<Product, ProductFilters>({
    createFilters: defaultFilters,
    fetchPage: params =>
      getProducts(params as unknown as Record<string, string | number>),
  })
  const { items, page, load, setPage } = list

  async function toggleStatus(product: Product) {
    const status = product.status === 'enabled' ? 'disabled' : 'enabled'
    await updateProductStatus(product.id, status)
    await load()
  }

  async function remove(product: Product) {
    await deleteProduct(product.id)
    // 删除当前页最后一项时回到上一页，避免停留在空白页。
    if (items.value.length === 1 && page.value > 1) {
      await setPage(page.value - 1)
      return
    }
    await load()
  }

  return {
    ...list,
    toggleStatus,
    remove,
  }
}
