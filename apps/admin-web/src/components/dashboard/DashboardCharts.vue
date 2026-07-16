<script setup lang="ts">
import type { QrStatusItem, ScanPoint } from '@/types/dashboard'

const props = defineProps<{
  scanPoints: ScanPoint[]
  qrStatuses: QrStatusItem[]
}>()

const chartWidth = 650
const chartHeight = 220
const chartPaddingX = 42
const chartPaddingTop = 20
const chartPaddingBottom = 36
const minValue = 500
const maxValue = 2000

const plottedPoints = computed(() =>
  props.scanPoints.map((point, index) => {
    const usableWidth = chartWidth - chartPaddingX * 2
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom
    const x = chartPaddingX + (usableWidth * index) / (props.scanPoints.length - 1)
    const y = chartPaddingTop + ((maxValue - point.value) / (maxValue - minValue)) * usableHeight
    return { ...point, x, y }
  }),
)

const linePath = computed(() =>
  plottedPoints.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
)

const areaPath = computed(() => {
  if (!plottedPoints.value.length) return ''
  const first = plottedPoints.value[0]
  const last = plottedPoints.value.at(-1)
  return `${linePath.value} L ${last?.x} ${chartHeight - chartPaddingBottom} L ${first?.x} ${chartHeight - chartPaddingBottom} Z`
})

const donutBackground = computed(() => {
  let cursor = 0
  const segments = props.qrStatuses.map((item) => {
    const start = cursor
    cursor += item.percent
    return `${item.color} ${start}% ${cursor}%`
  })
  return `conic-gradient(${segments.join(', ')})`
})

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
</script>

<template>
  <section class="grid grid-cols-[1.45fr_1fr] gap-4">
    <div class="page-card">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="m-0 text-base font-700 text-slate-900">扫码趋势统计</h3>
        <div class="flex rounded-2 bg-slate-100 p-1 text-xs">
          <span class="rounded-1.5 bg-blue-600 px-3 py-1.5 text-white">近7天</span>
          <span class="px-3 py-1.5 text-slate-500">近30天</span>
          <span class="px-3 py-1.5 text-slate-500">近90天</span>
        </div>
      </div>

      <svg class="h-60 w-full" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" role="img" aria-label="近七日扫码次数折线图">
        <defs>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#2563EB" stop-opacity=".22" />
            <stop offset="1" stop-color="#2563EB" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-for="tick in [500, 1000, 1500, 2000]" :key="tick">
          <line
            :x1="chartPaddingX"
            :x2="chartWidth - chartPaddingX"
            :y1="chartPaddingTop + ((maxValue - tick) / (maxValue - minValue)) * (chartHeight - chartPaddingTop - chartPaddingBottom)"
            :y2="chartPaddingTop + ((maxValue - tick) / (maxValue - minValue)) * (chartHeight - chartPaddingTop - chartPaddingBottom)"
            stroke="#E8EEF6"
            stroke-width="1"
          />
          <text
            x="4"
            :y="chartPaddingTop + ((maxValue - tick) / (maxValue - minValue)) * (chartHeight - chartPaddingTop - chartPaddingBottom) + 4"
            fill="#94A3B8"
            font-size="10"
          >{{ formatValue(tick) }}</text>
        </g>

        <path :d="areaPath" fill="url(#chart-area)" />
        <path :d="linePath" fill="none" stroke="#2563EB" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

        <g v-for="point in plottedPoints" :key="point.date">
          <circle :cx="point.x" :cy="point.y" r="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="3" />
          <text :x="point.x" :y="chartHeight - 12" fill="#64748B" font-size="10" text-anchor="middle">{{ point.date }}</text>
        </g>
      </svg>

      <div class="flex items-center justify-center gap-2 text-xs text-slate-500">
        <span class="h-2 w-2 rounded-full bg-blue-600" />
        扫码次数
      </div>
    </div>

    <div class="page-card">
      <h3 class="m-0 text-base font-700 text-slate-900">二维码状态分布</h3>
      <div class="mt-7 flex items-center justify-around gap-7">
        <div class="relative h-48 w-48 shrink-0 rounded-full" :style="{ background: donutBackground }">
          <div class="absolute inset-9 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <span class="text-xs text-slate-400">总数</span>
            <strong class="mt-1 text-xl text-slate-900">258,692</strong>
          </div>
        </div>

        <div class="min-w-52 flex-1 space-y-4">
          <div v-for="item in qrStatuses" :key="item.name" class="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-xs">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
            <span class="text-slate-600">{{ item.name }}</span>
            <span class="font-600 text-slate-700">
              {{ formatValue(item.value) }}
              <span class="ml-1 font-400 text-slate-400">({{ item.percent }}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
