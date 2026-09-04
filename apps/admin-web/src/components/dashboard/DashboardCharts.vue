<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { getScanTrend } from '@/api/dashboard'
import type { QrStatusItem, ScanPoint } from '@/types/dashboard'

const props = defineProps<{
  qrStatuses: QrStatusItem[]
}>()

const chartWidth = 650
const chartHeight = 220
const chartPaddingX = 42
const chartPaddingTop = 20
const chartPaddingBottom = 36

const scanPoints = ref<ScanPoint[]>([])
const days = ref(7)
const hoveredPointIndex = shallowRef<number | null>(null)

async function fetchScanTrend(d: number) {
  days.value = d
  hoveredPointIndex.value = null

  try {
    scanPoints.value = await getScanTrend(d)
  } catch (error) {
    console.error('Failed to fetch scan trend:', error)
  }
}

onMounted(() => fetchScanTrend(7))

const sortedScanPoints = computed(() =>
  [...scanPoints.value].sort((left, right) =>
    left.date.localeCompare(right.date),
  ),
)

const chartStep = computed(() => {
  const maxValue = Math.max(
    ...sortedScanPoints.value.map((point) => point.value),
    0,
  )

  return Math.max(1, Math.ceil(maxValue / 4))
})

const chartMax = computed(() => chartStep.value * 4)

const chartTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => index * chartStep.value),
)

const plottedPoints = computed(() =>
  sortedScanPoints.value.map((point, index) => {
    const usableWidth = chartWidth - chartPaddingX * 2
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom
    const divisor = Math.max(sortedScanPoints.value.length - 1, 1)
    const x = chartPaddingX + (usableWidth * index) / divisor
    const y =
      chartPaddingTop +
      ((chartMax.value - point.value) / chartMax.value) * usableHeight

    return { ...point, x, y }
  }),
)

const tooltipWidth = 148
const tooltipHeight = 50

const hoverBands = computed(() =>
  plottedPoints.value.map((point, index, points) => {
    const previous = points[index - 1]
    const next = points[index + 1]
    const left = previous ? (previous.x + point.x) / 2 : chartPaddingX
    const right = next
      ? (point.x + next.x) / 2
      : chartWidth - chartPaddingX

    return {
      date: point.date,
      left,
      width: right - left,
    }
  }),
)

const tooltip = computed(() => {
  const index = hoveredPointIndex.value
  if (index === null) return null

  const point = plottedPoints.value[index]
  if (!point) return null

  const left = Math.min(
    Math.max(point.x - tooltipWidth / 2, 4),
    chartWidth - tooltipWidth - 4,
  )
  const preferredTop = point.y - tooltipHeight - 12
  const top = preferredTop >= 4 ? preferredTop : point.y + 12

  return { point, left, top }
})

const axisLabelIndexes = computed(() => {
  const pointCount = plottedPoints.value.length
  const labelCount = Math.min(pointCount, 7)

  if (labelCount <= 1) return new Set([0])

  return new Set(
    Array.from({ length: labelCount }, (_, index) =>
      Math.round((index * (pointCount - 1)) / (labelCount - 1)),
    ),
  )
})

const linePath = computed(() =>
  plottedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' '),
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
  return segments.length && cursor
    ? `conic-gradient(${segments.join(', ')})`
    : '#E2E8F0'
})

const qrTotal = computed(() =>
  props.qrStatuses.reduce((total, item) => total + item.value, 0),
)

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatChartDate(date: string) {
  return date.slice(5)
}
</script>

<template>
  <section class="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
    <div class="page-card min-w-0">
      <div
        class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h3 class="m-0 text-base font-700 text-slate-900">扫码趋势统计</h3>
        <div class="flex self-start rounded-2 bg-slate-100 p-1 text-xs">
          <span
            class="cursor-pointer px-3 py-1.5 transition-colors"
            :class="
              days === 7
                ? 'rounded-1.5 bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="fetchScanTrend(7)"
            >近7天</span
          >
          <span
            class="cursor-pointer px-3 py-1.5 transition-colors"
            :class="
              days === 30
                ? 'rounded-1.5 bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="fetchScanTrend(30)"
            >近30天</span
          >
          <span
            class="cursor-pointer px-3 py-1.5 transition-colors"
            :class="
              days === 90
                ? 'rounded-1.5 bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="fetchScanTrend(90)"
            >近90天</span
          >
        </div>
      </div>

      <svg
        class="h-52 w-full sm:h-60"
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        role="img"
        :aria-label="`近${days}日扫码次数折线图`"
      >
        <defs>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#2563EB" stop-opacity=".22" />
            <stop offset="1" stop-color="#2563EB" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-for="tick in chartTicks" :key="tick">
          <line
            :x1="chartPaddingX"
            :x2="chartWidth - chartPaddingX"
            :y1="
              chartPaddingTop +
              ((chartMax - tick) / chartMax) *
                (chartHeight - chartPaddingTop - chartPaddingBottom)
            "
            :y2="
              chartPaddingTop +
              ((chartMax - tick) / chartMax) *
                (chartHeight - chartPaddingTop - chartPaddingBottom)
            "
            stroke="#E8EEF6"
            stroke-width="1"
          />
          <text
            x="4"
            :y="
              chartPaddingTop +
              ((chartMax - tick) / chartMax) *
                (chartHeight - chartPaddingTop - chartPaddingBottom) +
              4
            "
            fill="#94A3B8"
            font-size="10"
          >
            {{ formatValue(tick) }}
          </text>
        </g>

        <path :d="areaPath" fill="url(#chart-area)" />
        <path
          :d="linePath"
          fill="none"
          stroke="#2563EB"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <g v-for="(point, index) in plottedPoints" :key="point.date">
          <circle
            v-if="days <= 30 || index % 3 === 0"
            :cx="point.x"
            :cy="point.y"
            :r="days <= 7 ? 5 : 2"
            fill="#FFFFFF"
            stroke="#2563EB"
            :stroke-width="days <= 7 ? 3 : 1.5"
          />
          <text
            v-if="axisLabelIndexes.has(index)"
            :x="point.x"
            :y="chartHeight - 12"
            fill="#64748B"
            font-size="10"
            text-anchor="middle"
          >
            {{ formatChartDate(point.date) }}
          </text>
        </g>

        <rect
          v-for="(band, index) in hoverBands"
          :key="`hover-${band.date}`"
          class="cursor-crosshair"
          :x="band.left"
          :y="chartPaddingTop"
          :width="band.width"
          :height="chartHeight - chartPaddingTop - chartPaddingBottom"
          fill="transparent"
          @mouseenter="hoveredPointIndex = index"
          @mouseleave="hoveredPointIndex = null"
        />

        <g v-if="tooltip" pointer-events="none">
          <circle
            :cx="tooltip.point.x"
            :cy="tooltip.point.y"
            r="5"
            fill="#FFFFFF"
            stroke="#2563EB"
            stroke-width="3"
          />
          <rect
            :x="tooltip.left"
            :y="tooltip.top"
            :width="tooltipWidth"
            :height="tooltipHeight"
            rx="6"
            fill="#0F172A"
            fill-opacity=".92"
          />
          <text
            :x="tooltip.left + 10"
            :y="tooltip.top + 18"
            fill="#CBD5E1"
            font-size="10"
          >
            {{ tooltip.point.date }}
          </text>
          <text
            :x="tooltip.left + 10"
            :y="tooltip.top + 37"
            fill="#FFFFFF"
            font-size="11"
            font-weight="600"
          >
            扫码次数：{{ formatValue(tooltip.point.value) }}
          </text>
        </g>
      </svg>

      <div
        class="flex items-center justify-center gap-2 text-xs text-slate-500"
      >
        <span class="h-2 w-2 rounded-full bg-blue-600" />
        扫码次数
      </div>
    </div>

    <div class="page-card">
      <h3 class="m-0 text-base font-700 text-slate-900">二维码状态分布</h3>
      <div
        class="mt-7 flex flex-col items-center justify-around gap-7 sm:flex-row"
      >
        <div
          class="relative h-40 w-40 shrink-0 rounded-full sm:h-48 sm:w-48"
          :style="{ background: donutBackground }"
        >
          <div
            class="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-inner sm:inset-9"
          >
            <span class="text-xs text-slate-400">总数</span>
            <strong class="mt-1 text-xl text-slate-900">
              {{ formatValue(qrTotal) }}
            </strong>
          </div>
        </div>

        <div class="w-full min-w-0 flex-1 space-y-4 sm:min-w-52">
          <div
            v-for="item in qrStatuses"
            :key="item.name"
            class="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-xs"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: item.color }"
            />
            <span class="text-slate-600">{{ item.name }}</span>
            <span class="font-600 text-slate-700">
              {{ formatValue(item.value) }}
              <span class="ml-1 font-400 text-slate-400"
                >({{ item.percent }}%)</span
              >
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
