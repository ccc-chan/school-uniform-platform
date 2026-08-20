<script setup lang="ts">
import type { AnalyticsOverview } from '@/api/analytics'
import ConfigTable from '@/components/common/ConfigTable.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{ data: AnalyticsOverview }>()

const cards = computed(() => [
  { label: '扫码次数', value: props.data.metrics.scans, note: `较上一周期 ${trendText(props.data.metrics.scanChange)}`, tone: 'blue' as const },
  { label: '访问人数', value: props.data.metrics.visitors, note: `较上一周期 ${trendText(props.data.metrics.visitorChange)}`, tone: 'teal' as const },
  { label: '日均扫码', value: props.data.metrics.avgDailyScans, note: `统计周期 ${props.data.range.days} 天`, tone: 'violet' as const },
  { label: '覆盖区域', value: props.data.metrics.regions, note: '按省市去重统计', tone: 'amber' as const },
])

const hourlyMax = computed(() => Math.max(1, ...props.data.hourly.map((item) => item.scans)))
const donut = computed(() => {
  if (!props.data.devices.length) return '#E2E8F0'
  const colors = ['#2563EB', '#14B8A6', '#8B5CF6', '#F59E0B']
  let cursor = 0
  return `conic-gradient(${props.data.devices.map((item, index) => {
    const start = cursor
    cursor += item.percent
    return `${colors[index % colors.length]} ${start}% ${cursor}%`
  }).join(', ')})`
})

const columns: ConfigTableColumn[] = [
  { title: '扫码时间', dataIndex: 'scannedAt', key: 'scannedAt', width: 170 },
  { title: '二维码编号', dataIndex: 'qrCode', key: 'qrCode', width: 220 },
  { title: '产品', dataIndex: 'productName', key: 'productName' },
  { title: '访问地区', dataIndex: 'region', key: 'region', width: 170 },
  { title: '设备', dataIndex: 'device', key: 'device', width: 90 },
]

function trendText(value: number) {
  return `${value >= 0 ? '+' : ''}${value}%`
}
</script>

<template>
  <div class="space-y-4">
    <AnalyticsMetricCards :items="cards" />
    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div class="page-card min-w-0">
        <h3 class="m-0 text-base font-700 text-slate-900">扫码与访问趋势</h3>
        <p class="mb-4 mt-1 text-xs text-slate-400">{{ data.range.startDate }} 至 {{ data.range.endDate }}</p>
        <AnalyticsTrendChart :points="data.trend" />
      </div>
      <div class="page-card">
        <h3 class="m-0 text-base font-700 text-slate-900">访问设备分布</h3>
        <div class="mt-7 flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
          <div class="relative h-40 w-40 shrink-0 rounded-full" :style="{ background: donut }">
            <div class="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <span class="text-xs text-slate-400">扫码总数</span>
              <strong class="mt-1 text-xl text-slate-900">{{ data.metrics.scans }}</strong>
            </div>
          </div>
          <div class="w-full space-y-3">
            <div v-for="item in data.devices" :key="item.deviceType" class="flex items-center justify-between text-sm">
              <span class="text-slate-500">{{ item.name }}</span>
              <strong class="text-slate-800">{{ item.value }} <small class="font-400 text-slate-400">({{ item.percent }}%)</small></strong>
            </div>
            <a-empty v-if="!data.devices.length" :image-style="{ height: '48px' }" description="暂无设备数据" />
          </div>
        </div>
      </div>
    </section>
    <section class="page-card">
      <h3 class="m-0 text-base font-700 text-slate-900">24 小时扫码活跃度</h3>
      <div class="mt-6 grid h-44 grid-cols-12 items-end gap-1 sm:grid-cols-24 sm:gap-2">
        <div v-for="item in data.hourly" :key="item.hour" class="flex h-full flex-col items-center justify-end gap-2">
          <span class="text-[10px] text-slate-400">{{ item.scans || '' }}</span>
          <div class="min-h-1 w-full rounded-t-1 bg-blue-500/80" :style="{ height: `${Math.max(3, item.scans / hourlyMax * 110)}px` }" />
          <span v-if="item.hour % 2 === 0" class="text-[9px] text-slate-400">{{ String(item.hour).padStart(2, '0') }}</span>
        </div>
      </div>
    </section>
    <section class="page-card overflow-hidden">
      <h3 class="mb-4 mt-0 text-base font-700 text-slate-900">最近扫码记录</h3>
      <ConfigTable
        row-key="id"
        size="small"
        :columns="columns"
        :items="data.recentScans as unknown as Record<string, unknown>[]"
        :scroll-x="900"
      />
    </section>
  </div>
</template>
