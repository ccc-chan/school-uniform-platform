import { message } from 'ant-design-vue'
import type { QrGenerationResult } from '@/api/qrcodes'
import { useQrOptions } from '@/composables/useQrOptions'

/**
 * 二维码生成页面级 ViewModel。
 *
 * 负责读取路由初始值、加载产品选项，以及生成完成后的流程导航。
 */
export function useQrGenerateViewModel() {
  const router = useRouter()
  const route = useRoute()
  const options = useQrOptions()

  const initialProductId = computed(() =>
    Number(route.query.productId || 0),
  )
  const initialQuantity = computed(() =>
    Number(route.query.quantity || 1000),
  )
  const initialProductionBatch = computed(() =>
    String(route.query.productionBatch || ''),
  )
  const returnPath = computed(() =>
    initialProductId.value
      ? `/products/${initialProductId.value}`
      : '/qrcodes/label-print',
  )

  async function initialize() {
    try {
      await options.loadProducts()
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '产品选项加载失败',
      )
    }
  }

  function cancel() {
    return router.push(returnPath.value)
  }

  function complete(result: QrGenerationResult) {
    return router.push({
      path: '/qrcodes/bind',
      query: {
        generationBatchId: result.id,
        productId: initialProductId.value || undefined,
        quantity: initialQuantity.value,
        productionBatch:
          initialProductionBatch.value || undefined,
      },
    })
  }

  return {
    products: options.products,
    loadingProducts: options.loadingProducts,
    initialProductId,
    initialQuantity,
    initialize,
    cancel,
    complete,
  }
}
