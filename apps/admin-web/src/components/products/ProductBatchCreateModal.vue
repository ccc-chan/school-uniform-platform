<script setup lang="ts">
import type { ProductionItem } from '@/api/production'
import ProductionBatchCreateDrawer from '@/components/production/ProductionBatchCreateDrawer.vue'

const props = defineProps<{
  open: boolean
  productId: number
  productName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [batchId: number]
}>()

function created(batch: ProductionItem) {
  emit('update:open', false)
  emit('created', batch.id)
}
</script>

<template>
  <ProductionBatchCreateDrawer
    :open="open"
    :product="{ id: productId, name: productName }"
    @close="emit('update:open', false)"
    @created="created"
  />
</template>
