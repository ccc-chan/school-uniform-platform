<script setup lang="ts">
import type { AnalyticsProductOption } from '@/api/analytics'

defineProps<{
  products: AnalyticsProductOption[]
  loading: boolean
}>()

const emit = defineEmits<{ refresh: [] }>()
const range = defineModel<number>('range', { required: true })
const productId = defineModel<number | undefined>('productId')

const rangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
]
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="page-title">数据统计</h2>
      <p class="mb-0 mt-2 text-secondary">消费者扫码、产品热度与访问区域综合分析</p>
    </div>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <a-segmented v-model:value="range" :options="rangeOptions" />
      <a-select
        v-model:value="productId"
        allow-clear
        class="w-full sm:w-64"
        placeholder="全部产品"
        :options="products.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))"
      />
      <a-button :loading="loading" @click="emit('refresh')">刷新</a-button>
    </div>
  </div>
</template>
