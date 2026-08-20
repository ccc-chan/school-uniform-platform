import {
  getQrBatches,
  getQrProducts,
  type QrBatchOption,
  type QrProductOption,
} from '@/api/qrcodes'

/**
 * 分别加载二维码操作所需的产品选项和可绑定生成批次。
 */
export function useQrOptions() {
  const products = shallowRef<QrProductOption[]>([])
  const batches = shallowRef<QrBatchOption[]>([])
  // 两组选项可能独立加载，因此各自维护 loading 状态。
  const loadingProducts = shallowRef(false)
  const loadingBatches = shallowRef(false)

  async function loadProducts() {
    loadingProducts.value = true
    try {
      products.value = await getQrProducts()
    } finally {
      loadingProducts.value = false
    }
  }

  async function loadBatches() {
    loadingBatches.value = true
    try {
      batches.value = await getQrBatches()
    } finally {
      loadingBatches.value = false
    }
  }

  return {
    products: readonly(products),
    batches: readonly(batches),
    loadingProducts: readonly(loadingProducts),
    loadingBatches: readonly(loadingBatches),
    loadProducts,
    loadBatches,
  }
}
