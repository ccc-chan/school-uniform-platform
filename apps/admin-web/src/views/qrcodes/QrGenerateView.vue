<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { QrGenerationResult } from '@/api/qrcodes'
import QrGenerationWizard from '@/components/qrcodes/QrGenerationWizard.vue'
import { useQrOptions } from '@/composables/useQrOptions'

const router = useRouter()
const route = useRoute()
const { products, loadingProducts, loadProducts } = useQrOptions()
const initialProductId = computed(() => Number(route.query.productId || 0))
const initialQuantity = computed(() => Number(route.query.quantity || 1000))
const initialProductionBatch = computed(() =>
  String(route.query.productionBatch || ''),
)
const returnPath = computed(() =>
  initialProductId.value
    ? `/products/${initialProductId.value}`
    : '/qrcodes/label-print',
)

function handleSuccess(result: QrGenerationResult) {
  router.push({
    path: '/qrcodes/bind',
    query: {
      generationBatchId: result.id,
      productId: initialProductId.value || undefined,
      quantity: initialQuantity.value,
      productionBatch: initialProductionBatch.value || undefined,
    },
  })
}

onMounted(async () => {
  try {
    await loadProducts()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '产品选项加载失败')
  }
})
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div>
      <h2 class="page-title">生成二维码</h2>
      <p class="mb-0 mt-2 text-secondary">为指定产品创建唯一二维码编号</p>
    </div>
    <QrGenerationWizard
      :products="products"
      :loading-products="loadingProducts"
      :initial-product-id="initialProductId"
      :initial-quantity="initialQuantity"
      @cancel="router.push(returnPath)"
      @success="handleSuccess"
    />
  </section>
</template>
