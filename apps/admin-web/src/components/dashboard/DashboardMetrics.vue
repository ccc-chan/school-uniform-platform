<script setup lang="ts">
import {
  AppstoreOutlined,
  FileSearchOutlined,
  LinkOutlined,
  QrcodeOutlined,
  ScanOutlined,
} from '@ant-design/icons-vue'
import type { Component } from 'vue'
import type { MetricIcon, MetricItem } from '@/types/dashboard'

const metricIcons = {
  scan: ScanOutlined,
  qrcode: QrcodeOutlined,
  bound: LinkOutlined,
  product: AppstoreOutlined,
  report: FileSearchOutlined,
} satisfies Record<MetricIcon, Component>

defineProps<{
  items: MetricItem[]
}>()

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
</script>

<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
    <div
      v-for="item in items"
      :key="item.label"
      class="page-card relative min-h-31 overflow-hidden"
    >
      <div class="relative z-1 flex items-start justify-between">
        <div>
          <div class="text-sm text-slate-500">{{ item.label }}</div>
          <div class="mt-3 text-7 font-700 tracking-tight text-slate-900">
            {{ formatValue(item.value) }}
          </div>
          <div class="mt-3 text-xs text-slate-400">
            {{ item.trendLabel }}
            <span class="ml-1 font-600" :style="{ color: item.color }">
              {{ item.trend }}
            </span>
          </div>
        </div>
        <div
          class="h-11 w-11 flex items-center justify-center rounded-3 text-xl"
          :style="{ color: item.color, backgroundColor: item.softColor }"
        >
          <component
            :is="metricIcons[item.icon]"
            class="text-5"
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        class="absolute bottom-0 right-0 h-12 w-24 opacity-30"
        :style="{ background: `linear-gradient(145deg, transparent 30%, ${item.softColor})` }"
      />
    </div>
  </section>
</template>
