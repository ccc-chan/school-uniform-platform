<script setup lang="ts">
import { message } from 'ant-design-vue'
import QrBindingWizard from '@/components/qrcodes/QrBindingWizard.vue'
import { useQrOptions } from '@/composables/useQrOptions'

const router = useRouter()
const route = useRoute()
const { batches, loadingBatches, loadBatches } = useQrOptions()
const initialProductId = computed(() => Number(route.query.productId || 0))
const initialProductionBatch = computed(() => String(route.query.productionBatch || ''))
const initialGenerationBatchId = computed(() =>
  Number(route.query.generationBatchId || 0),
)
const initialQuantity = computed(() => Number(route.query.quantity || 1))
const returnPath = computed(() =>
  initialProductId.value
    ? `/products/${initialProductId.value}`
    : '/qrcodes/label-print',
)

onMounted(async () => {
  try {
    await loadBatches()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '二维码批次加载失败')
  }
})
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div>
      <h2 class="page-title">二维码绑定</h2>
      <p class="mb-0 mt-2 text-secondary">将未绑定二维码关联到产品 SKU 和生产批次</p>
    </div>
    <QrBindingWizard
      :batches="batches"
      :loading-batches="loadingBatches"
      :initial-product-id="initialProductId"
      :initial-production-batch="initialProductionBatch"
      :initial-generation-batch-id="initialGenerationBatchId"
      :initial-quantity="initialQuantity"
      @cancel="router.push(returnPath)"
      @success="router.push(returnPath)"
    />
  </section>
</template>
