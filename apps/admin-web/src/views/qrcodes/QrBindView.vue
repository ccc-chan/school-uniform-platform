<script setup lang="ts">
import QrBindingWizard from '@/components/qrcodes/QrBindingWizard.vue'
import { useQrBindViewModel } from '@/features/qrcodes/binding/useQrBindViewModel'

const {
  batches,
  loadingBatches,
  initialProductId,
  initialProductionBatch,
  initialGenerationBatchId,
  initialQuantity,
  initialize,
  cancel,
  complete,
} = useQrBindViewModel()

onMounted(initialize)
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
      @cancel="cancel"
      @success="complete"
    />
  </section>
</template>
