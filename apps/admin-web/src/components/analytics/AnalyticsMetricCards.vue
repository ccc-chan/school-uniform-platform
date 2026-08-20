<script setup lang="ts">
interface MetricCard {
  label: string
  value: number
  suffix?: string
  note: string
  tone: 'blue' | 'teal' | 'violet' | 'amber'
}

defineProps<{ items: MetricCard[] }>()

const tones = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article v-for="item in items" :key="item.label" class="page-card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="m-0 text-sm text-slate-500">{{ item.label }}</p>
          <strong class="mt-3 block text-7 font-700 text-slate-900">
            {{ formatNumber(item.value) }}<small class="ml-1 text-sm font-500 text-slate-400">{{ item.suffix }}</small>
          </strong>
        </div>
        <span class="h-10 w-10 flex items-center justify-center rounded-3 text-lg" :class="tones[item.tone]">⌁</span>
      </div>
      <p class="mb-0 mt-4 text-xs text-slate-400">{{ item.note }}</p>
    </article>
  </section>
</template>
