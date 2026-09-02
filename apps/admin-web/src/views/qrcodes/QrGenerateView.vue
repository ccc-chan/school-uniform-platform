<script setup lang="ts">
import QrGenerationWizard from '@/components/qrcodes/QrGenerationWizard.vue'
import { useQrGenerateViewModel } from '@/features/qrcodes/generate/useQrGenerateViewModel'

const {
  products,
  loadingProducts,
  initialProductId,
  initialQuantity,
  initialize,
  cancel,
  complete,
} = useQrGenerateViewModel()

onMounted(initialize)
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
      @cancel="cancel"
      @success="complete"
    />
  </section>
</template>
