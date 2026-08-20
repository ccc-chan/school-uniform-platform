<script setup lang="ts">
import type { AnalyticsTrendPoint } from '@/api/analytics'

const props = withDefaults(
  defineProps<{ points: AnalyticsTrendPoint[]; dark?: boolean }>(),
  { dark: false },
)

const width = 760
const height = 260
const padding = { left: 48, right: 20, top: 20, bottom: 42 }

const maxValue = computed(() =>
  Math.max(1, ...props.points.flatMap((item) => [item.scans, item.visitors])),
)

const plotted = computed(() => {
  const usableWidth = width - padding.left - padding.right
  const usableHeight = height - padding.top - padding.bottom
  const divisor = Math.max(1, props.points.length - 1)
  return props.points.map((item, index) => ({
    ...item,
    x: padding.left + (usableWidth * index) / divisor,
    scansY: padding.top + usableHeight * (1 - item.scans / maxValue.value),
    visitorsY: padding.top + usableHeight * (1 - item.visitors / maxValue.value),
  }))
})

const scanPath = computed(() =>
  plotted.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.scansY}`).join(' '),
)
const visitorPath = computed(() =>
  plotted.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.visitorsY}`).join(' '),
)
const labelStep = computed(() => Math.max(1, Math.ceil(props.points.length / 7)))
const gridColor = computed(() => (props.dark ? '#173665' : '#E7EDF5'))
const textColor = computed(() => (props.dark ? '#7FA6D9' : '#94A3B8'))

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Math.round(value))
}
</script>

<template>
  <div>
    <svg class="h-56 w-full" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="扫码与访问人数趋势图">
      <g v-for="tick in [0, 0.25, 0.5, 0.75, 1]" :key="tick">
        <line
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="padding.top + (height - padding.top - padding.bottom) * (1 - tick)"
          :y2="padding.top + (height - padding.top - padding.bottom) * (1 - tick)"
          :stroke="gridColor"
        />
        <text
          x="4"
          :y="padding.top + (height - padding.top - padding.bottom) * (1 - tick) + 4"
          :fill="textColor"
          font-size="11"
        >{{ formatNumber(maxValue * tick) }}</text>
      </g>
      <path :d="scanPath" fill="none" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <path :d="visitorPath" fill="none" stroke="#14B8A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <g v-for="(point, index) in plotted" :key="point.date">
        <circle :cx="point.x" :cy="point.scansY" r="3.5" fill="#3B82F6" />
        <text
          v-if="index % labelStep === 0 || index === plotted.length - 1"
          :x="point.x"
          :y="height - 14"
          :fill="textColor"
          font-size="10"
          text-anchor="middle"
        >{{ point.date.slice(5) }}</text>
      </g>
    </svg>
    <div class="flex justify-center gap-6 text-xs" :class="dark ? 'text-blue-200/70' : 'text-slate-500'">
      <span class="flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-blue-500" />扫码次数</span>
      <span class="flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-teal-500" />访问人数</span>
    </div>
  </div>
</template>
