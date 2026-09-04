<script setup lang="ts">
import AnalyticsScreenPanel from '@/components/analytics/AnalyticsScreenPanel.vue'
import ProductAnalysisPanel from '@/components/analytics/ProductAnalysisPanel.vue'
import RegionAnalysisPanel from '@/components/analytics/RegionAnalysisPanel.vue'
import ScanAnalysisPanel from '@/components/analytics/ScanAnalysisPanel.vue'
import { useAnalytics } from '@/composables/useAnalytics'

const route = useRoute()
const { filters, overview, options, loading, load } = useAnalytics()
const page = computed(() => String(route.meta.analyticsPage || 'scans'))
const componentMap = {
  scans: ScanAnalysisPanel,
  products: ProductAnalysisPanel,
  regions: RegionAnalysisPanel,
  screen: AnalyticsScreenPanel,
}
const activeComponent = computed(
  () => componentMap[page.value as keyof typeof componentMap] || ScanAnalysisPanel,
)
</script>

<template>
  <section class="mx-auto max-w-420 space-y-4">
    <div v-if="page !== 'screen'" class="page-card">
      <AnalyticsFilterBar
        v-model:range="filters.range"
        v-model:product-id="filters.productId"
        :products="options.products"
        :loading="loading"
        @refresh="load"
      />
    </div>
    <a-spin :spinning="loading">
      <component :is="activeComponent" :data="overview" />
    </a-spin>
  </section>
</template>
