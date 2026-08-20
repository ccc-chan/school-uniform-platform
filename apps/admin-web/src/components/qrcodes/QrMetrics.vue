<script setup lang="ts">
import type { QrMetrics } from '@/api/qrcodes'

const props = defineProps<{ metrics: QrMetrics }>()

const cards = computed(() => [
  {
    key: 'total',
    label: '二维码总量',
    value: props.metrics.total,
    icon: '⌗',
    tone: 'blue',
  },
  {
    key: 'bound',
    label: '已绑定',
    value: props.metrics.bound,
    icon: '✓',
    tone: 'slate',
  },
  {
    key: 'unbound',
    label: '未绑定',
    value: props.metrics.unbound,
    icon: '□',
    tone: 'emerald',
  },
  {
    key: 'voided',
    label: '已作废',
    value: props.metrics.voided,
    icon: '×',
    tone: 'red',
  },
])

const number = new Intl.NumberFormat('zh-CN')
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="card in cards"
      :key="card.key"
      class="metric-card"
      :class="`metric-card--${card.tone}`"
    >
      <div>
        <div class="text-sm text-slate-500">{{ card.label }}</div>
        <div class="mt-2 text-7 font-700 tracking-tight text-slate-900">
          {{ number.format(card.value) }}
        </div>
      </div>
      <span class="metric-card__icon">{{ card.icon }}</span>
    </article>
  </div>
</template>

<style scoped>
.metric-card {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 4px 18px rgb(15 23 42 / 4%);
}

.metric-card__icon {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.metric-card--blue .metric-card__icon {
  color: #2563eb;
  background: #eff6ff;
}

.metric-card--slate .metric-card__icon {
  color: #475569;
  background: #f1f5f9;
}

.metric-card--emerald .metric-card__icon {
  color: #059669;
  background: #ecfdf5;
}

.metric-card--red .metric-card__icon {
  color: #dc2626;
  background: #fef2f2;
}
</style>
