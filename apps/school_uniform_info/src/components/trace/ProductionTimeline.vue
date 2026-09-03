<script setup lang="ts">
import { computed } from 'vue'
import type {
  ProductionStep,
  ProductionStepStatus,
} from '@/api/school_uniform_info'

const props = defineProps<{
  batchNo: string
  productionDate: string
  factoryName: string
  steps: readonly ProductionStep[]
}>()

const dayMilliseconds = 24 * 60 * 60 * 1000

function dateOnly(value: string | null | undefined) {
  return value?.slice(0, 10) || ''
}

function dateValue(value: string) {
  return Date.parse(`${value}T00:00:00`)
}

function dateRange(step: ProductionStep) {
  const start = dateOnly(step.startedAt)
  const end = dateOnly(step.completedAt)

  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || end
}

function statusTone(status: ProductionStepStatus, nodeName: string) {
  if (status === 'exception') return 'danger'
  if (status === 'pending') return 'muted'
  if (status === 'completed' && /质检|检验|检测/.test(nodeName)) {
    return 'success'
  }
  return 'active'
}

const cycleDays = computed(() => {
  const dates = [
    dateOnly(props.productionDate),
    ...props.steps.flatMap((step) => [
      dateOnly(step.startedAt),
      dateOnly(step.completedAt),
    ]),
  ]
    .filter(Boolean)
    .map(dateValue)
    .filter(Number.isFinite)

  if (!dates.length) return null

  return Math.max(
    1,
    Math.ceil((Math.max(...dates) - Math.min(...dates)) / dayMilliseconds),
  )
})

const timelineSteps = computed(() =>
  props.steps.map((step) => {
    const range = dateRange(step)
    const metadata = [
      step.status === 'pending' && range ? `预计 ${range}` : range,
      props.factoryName,
      step.operatorName,
    ].filter(Boolean)

    let result = ''
    if (
      step.status === 'completed' &&
      /质检|检验|检测/.test(step.nodeName)
    ) {
      result = '合格 ✓'
    } else if (step.status === 'in_progress') {
      result = '进行中'
    } else if (step.status === 'exception') {
      result = '异常'
    }

    return {
      ...step,
      metadata: metadata.join(' · '),
      result,
      tone: statusTone(step.status, step.nodeName),
    }
  }),
)
</script>

<template>
  <section class="production-timeline">
    <p class="production-timeline__summary">
      批次 <strong>{{ batchNo || '暂无' }}</strong>
      <template v-if="cycleDays">
        <span>·</span>
        周期 <strong>{{ cycleDays }} 天</strong>
      </template>
    </p>

    <ol v-if="timelineSteps.length" class="production-timeline__list">
      <li
        v-for="step in timelineSteps"
        :key="step.id"
        class="production-timeline__step"
        :class="`production-timeline__step--${step.tone}`"
      >
        <span class="production-timeline__dot" aria-hidden="true" />

        <div>
          <h2>
            {{ step.nodeName }}
            <small v-if="step.result">{{ step.result }}</small>
          </h2>
          <p>{{ step.metadata || '时间及操作信息待补充' }}</p>
        </div>
      </li>
    </ol>

    <p v-else class="production-timeline__empty">
      该批次暂无可展示的生产流程
    </p>
  </section>
</template>

<style scoped>
.production-timeline {
  padding: 16px 20px 36px;
}

.production-timeline__summary {
  margin: 0 0 22px;
  color: #64748b;
  font-size: 13px;
}

.production-timeline__summary strong {
  color: #334155;
  font-weight: 700;
}

.production-timeline__summary span {
  margin: 0 6px;
}

.production-timeline__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.production-timeline__step {
  position: relative;
  display: grid;
  min-height: 58px;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 14px;
}

.production-timeline__step::before {
  position: absolute;
  top: 15px;
  bottom: -1px;
  left: 6px;
  width: 1px;
  background: #e2e8f0;
  content: "";
}

.production-timeline__step:last-child::before {
  display: none;
}

.production-timeline__dot {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border: 3px solid #dbeafe;
  border-radius: 50%;
  background: #3b82f6;
  box-sizing: content-box;
}

.production-timeline__step h2 {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  line-height: 20px;
}

.production-timeline__step h2 small {
  margin-left: 5px;
  color: #16a34a;
  font-size: 12px;
  font-weight: 700;
}

.production-timeline__step p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.production-timeline__step--success .production-timeline__dot {
  border-color: #dcfce7;
  background: #22c55e;
}

.production-timeline__step--muted .production-timeline__dot {
  border-color: #f1f5f9;
  background: #cbd5e1;
}

.production-timeline__step--muted h2,
.production-timeline__step--muted p {
  color: #94a3b8;
}

.production-timeline__step--danger .production-timeline__dot {
  border-color: #fee2e2;
  background: #ef4444;
}

.production-timeline__step--danger h2,
.production-timeline__step--danger p {
  color: #dc2626;
}

.production-timeline__empty {
  margin: 48px 0;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}
</style>
