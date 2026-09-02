import { message } from 'ant-design-vue'
import { useQrOptions } from '@/composables/useQrOptions'

/**
 * 二维码绑定页面级 ViewModel。
 *
 * 负责读取生成批次上下文、加载可绑定批次，并管理取消和完成导航。
 */
export function useQrBindViewModel() {
  const router = useRouter()
  const route = useRoute()
  const options = useQrOptions()

  const initialProductId = computed(() =>
    Number(route.query.productId || 0),
  )
  const initialProductionBatch = computed(() =>
    String(route.query.productionBatch || ''),
  )
  const initialGenerationBatchId = computed(() =>
    Number(route.query.generationBatchId || 0),
  )
  const initialQuantity = computed(() =>
    Number(route.query.quantity || 1),
  )
  const returnPath = computed(() =>
    initialProductId.value
      ? `/products/${initialProductId.value}`
      : '/qrcodes/label-print',
  )

  async function initialize() {
    try {
      await options.loadBatches()
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '二维码批次加载失败',
      )
    }
  }

  function cancel() {
    return router.push(returnPath.value)
  }

  function complete() {
    return router.push(returnPath.value)
  }

  return {
    batches: options.batches,
    loadingBatches: options.loadingBatches,
    initialProductId,
    initialProductionBatch,
    initialGenerationBatchId,
    initialQuantity,
    initialize,
    cancel,
    complete,
  }
}
