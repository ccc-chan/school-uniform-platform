<script setup lang="ts">
import type { AnalyticsOverview, AnalyticsRegionItem } from '@/api/analytics'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{ data: AnalyticsOverview }>()

const provinces = computed(() => {
  const map = new Map<string, AnalyticsRegionItem>()
  for (const item of props.data.regions) {
    const current = map.get(item.province)
    if (current) {
      current.scans += item.scans
      current.visitors += item.visitors
    } else {
      map.set(item.province, { ...item, city: '' })
    }
  }
  const total = props.data.metrics.scans
  return [...map.values()]
    .map((item) => ({ ...item, share: total ? Number((item.scans / total * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.scans - a.scans)
})
const maxScans = computed(() => Math.max(1, ...provinces.value.map((item) => item.scans)))
const topProvince = computed(() => provinces.value[0])
const cards = computed(() => [
  { label: '覆盖省份', value: provinces.value.length, note: '产生扫码记录的省级区域', tone: 'blue' as const },
  { label: '覆盖省市', value: props.data.metrics.regions, note: '按省市组合去重', tone: 'teal' as const },
  { label: '区域访问人数', value: props.data.metrics.visitors, note: '按访客标识去重', tone: 'violet' as const },
  { label: 'TOP1 地区占比', value: topProvince.value?.share || 0, suffix: '%', note: topProvince.value?.province || '暂无地区数据', tone: 'amber' as const },
])
const columns: ConfigTableColumn[] = [
  { title: '省份', dataIndex: 'province', key: 'province', width: 140 },
  { title: '城市', dataIndex: 'city', key: 'city', width: 160 },
  { title: '扫码次数', dataIndex: 'scans', key: 'scans', width: 120 },
  { title: '访问人数', dataIndex: 'visitors', key: 'visitors', width: 120 },
  { title: '扫码占比', dataIndex: 'share', key: 'share', width: 120 },
]
</script>

<template>
  <div class="space-y-4">
    <AnalyticsMetricCards :items="cards" />
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
      <div class="page-card">
        <h3 class="m-0 text-base font-700 text-slate-900">区域热度分布</h3>
        <p class="mb-5 mt-1 text-xs text-slate-400">颜色越深表示扫码越活跃</p>
        <div v-if="provinces.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <article
            v-for="item in provinces.slice(0, 16)"
            :key="item.province"
            class="rounded-3 border border-blue-100 p-4 text-center"
            :style="{ backgroundColor: `rgba(37, 99, 235, ${0.08 + item.scans / maxScans * 0.5})` }"
          >
            <strong class="block text-sm text-slate-800">{{ item.province }}</strong>
            <span class="mt-2 block text-lg font-700 text-blue-700">{{ item.scans }}</span>
            <small class="text-slate-500">{{ item.share }}%</small>
          </article>
        </div>
        <a-empty v-else class="py-12" description="暂无区域扫码数据" />
      </div>
      <div class="page-card">
        <h3 class="m-0 text-base font-700 text-slate-900">省份访问排行</h3>
        <div v-if="provinces.length" class="mt-6 space-y-5">
          <div v-for="(item, index) in provinces.slice(0, 10)" :key="item.province" class="grid grid-cols-[32px_minmax(0,1fr)_70px] items-center gap-3">
            <span class="text-xs font-700 text-slate-400">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <div class="mb-2 flex justify-between text-sm"><span class="text-slate-700">{{ item.province }}</span><span class="text-slate-400">{{ item.share }}%</span></div>
              <div class="h-2 rounded-full bg-slate-100"><div class="h-full rounded-full bg-teal-500" :style="{ width: `${item.scans / maxScans * 100}%` }" /></div>
            </div>
            <strong class="text-right text-sm text-slate-800">{{ item.scans }}</strong>
          </div>
        </div>
        <a-empty v-else class="py-12" description="暂无省份排行" />
      </div>
    </section>
    <section class="page-card overflow-hidden">
      <h3 class="mb-4 mt-0 text-base font-700 text-slate-900">省市访问明细</h3>
      <ConfigTable
        row-key="city"
        size="small"
        :columns="columns"
        :items="data.regions as unknown as Record<string, unknown>[]"
        :scroll-x="680"
      >
        <template #cell="{ column, value }">
          <template v-if="column.key === 'share'">{{ value }}%</template>
          <OverflowTooltip v-else :content="value" />
        </template>
      </ConfigTable>
    </section>
  </div>
</template>
