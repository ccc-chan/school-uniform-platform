<script setup lang="ts">
import type { ProductQrCodeType } from '@/api/products'

type ProductQrCodeTypeFilter = ProductQrCodeType | ''

defineProps<{
  value: ProductQrCodeTypeFilter
  loading: boolean
}>()

const emit = defineEmits<{
  select: [value: ProductQrCodeTypeFilter]
}>()

const options: Array<{
  label: string
  value: ProductQrCodeTypeFilter
}> = [
  { label: '全部', value: '' },
  { label: '一品一码', value: 'product' },
  { label: '一批一码', value: 'batch' },
  { label: '一校一码', value: 'school' },
]
</script>

<template>
  <div class="product-qr-tabs" role="tablist" aria-label="二维码类型">
    <button
      v-for="option in options"
      :key="option.value || 'all'"
      type="button"
      role="tab"
      class="product-qr-tabs__item"
      :class="{ 'product-qr-tabs__item--active': value === option.value }"
      :aria-selected="value === option.value"
      :disabled="loading"
      @click="emit('select', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.product-qr-tabs {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: #f1f5f9;
}

.product-qr-tabs__item {
  min-width: 70px;
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  color: #475569;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}

.product-qr-tabs__item--active {
  color: #fff;
  background: #2563eb;
  box-shadow: 0 4px 10px rgb(37 99 235 / 24%);
  font-weight: 600;
}

.product-qr-tabs__item:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 639px) {
  .product-qr-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    width: 100%;
  }

  .product-qr-tabs__item {
    min-width: 0;
    padding: 0 8px;
  }
}
</style>
