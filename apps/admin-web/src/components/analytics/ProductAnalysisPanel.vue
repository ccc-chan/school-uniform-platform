<script setup lang="ts">
import type { AnalyticsOverview } from '@/api/analytics'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{ data: AnalyticsOverview }>()

const topProduct = computed(() => props.data.products[0])
const maxScans = computed(() => Math.max(1, ...props.data.products.map((item) => item.scans)))
const cards = computed(() => [
  { label: '扫码产品数', value: props.data.metrics.products, note: '统计周期内产生扫码的产品', tone: 'blue' as const },
  { label: '产品扫码总量', value: props.data.metrics.scans, note: `覆盖 ${props.data.range.days} 天`, tone: 'teal' as const },
  { label: '产品访问人数', value: props.data.metrics.visitors, note: '按访客标识去重', tone: 'violet' as const },
  { label: 'TOP1 产品占比', value: topProduct.value?.share || 0, suffix: '%', note: topProduct.value?.productName || '暂无扫码产品', tone: 'amber' as const },
])

const columns: ConfigTableColumn[] = [
  { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 150 },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '扫码次数', dataIndex: 'scans', key: 'scans', width: 120 },
  { title: '访问人数', dataIndex: 'visitors', key: 'visitors', width: 120 },
  { title: '扫码二维码数', dataIndex: 'qrCount', key: 'qrCount', width: 140 },
  { title: '扫码占比', dataIndex: 'share', key: 'share', width: 120 },
]
</script>

<template>
  <div class="space-y-4">
    <AnalyticsMetricCards :items="cards" />
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
      <div class="page-card">
        <h3 class="m-0 text-base font-700 text-slate-900">热门产品 TOP10</h3>
        <div v-if="data.products.length" class="mt-6 space-y-5">
          <div v-for="(item, index) in data.products.slice(0, 10)" :key="item.productCode" class="grid grid-cols-[28px_minmax(0,1fr)_70px] items-center gap-3">
            <span class="text-center text-xs font-700" :class="index < 3 ? 'text-blue-600' : 'text-slate-400'">{{ index + 1 }}</span>
            <div class="min-w-0">
              <div class="mb-2 flex items-center justify-between gap-3 text-sm">
                <span class="truncate text-slate-700">{{ item.productName }}</span>
                <span class="shrink-0 text-xs text-slate-400">{{ item.share }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" :style="{ width: `${item.scans / maxScans * 100}%` }" />
              </div>
            </div>
            <strong class="text-right text-sm text-slate-800">{{ item.scans }}</strong>
          </div>
        </div>
        <a-empty v-else class="py-12" description="暂无产品扫码数据" />
      </div>
      <div class="page-card min-w-0">
        <h3 class="m-0 text-base font-700 text-slate-900">产品访问趋势</h3>
        <p class="mb-4 mt-1 text-xs text-slate-400">查看扫码与独立访客变化</p>
        <AnalyticsTrendChart :points="data.trend" />
      </div>
    </section>
    <section class="page-card overflow-hidden">
      <h3 class="mb-4 mt-0 text-base font-700 text-slate-900">产品扫码明细</h3>
      <ConfigTable
        row-key="productCode"
        size="small"
        :columns="columns"
        :items="data.products as unknown as Record<string, unknown>[]"
        :scroll-x="860"
      >
        <template #cell="{ column, value }">
          <template v-if="column.key === 'share'">{{ value }}%</template>
          <OverflowTooltip v-else :content="value" />
        </template>
      </ConfigTable>
    </section>
  </div>
</template>
