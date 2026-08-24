<script setup lang="ts">
import type { ProductProductionStep } from '@/api/products'

defineProps<{
  steps: readonly ProductProductionStep[]
  canView: boolean
  canManage: boolean
  deletingId: number | null
}>()

const emit = defineEmits<{
  add: []
  remove: [stepId: number]
}>()

function stepDate(step: ProductProductionStep) {
  const value = step.completedAt || step.startedAt
  return value && value !== '-' ? value : '待安排'
}
</script>

<template>
  <section class="production-timeline">
    <header class="production-timeline__header">
      <h3>生产流程</h3>
      <a-button v-if="canManage" @click="emit('add')">＋ 添加</a-button>
    </header>

    <p v-if="!canView" class="production-timeline__empty">
      当前账号没有生产流程查看权限
    </p>

    <ol v-else-if="steps.length" class="production-timeline__list">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :class="{ 'production-timeline__item--latest': index === steps.length - 1 }"
      >
        <span class="production-timeline__dot" />
        <div class="production-timeline__content">
          <strong>{{ step.nodeName }}</strong>
          <span>{{ stepDate(step) }} · {{ step.employeeName || '待安排' }}</span>
        </div>
        <a-popconfirm
          v-if="canManage"
          title="确认删除这个生产环节？"
          ok-text="删除"
          cancel-text="取消"
          @confirm="emit('remove', step.id)"
        >
          <a-button
            type="text"
            danger
            shape="circle"
            size="small"
            class="production-timeline__delete"
            aria-label="删除环节"
            :loading="deletingId === step.id"
          >
            <svg
              v-if="deletingId !== step.id"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
            </svg>
          </a-button>
        </a-popconfirm>
      </li>
    </ol>

    <p v-else class="production-timeline__empty">该批次暂无生产环节</p>
  </section>
</template>

<style scoped>
.production-timeline {
  min-height: 248px;
  border: 1px solid #dfe7f1;
  border-radius: 14px;
  background: #fff;
  padding: 18px 20px;
}
.production-timeline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.production-timeline__header h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
}
.production-timeline__header :deep(.ant-btn) {
  height: 30px;
  border-radius: 8px;
  color: #526078;
  font-size: 11px;
}
.production-timeline__list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.production-timeline__list li {
  position: relative;
  display: flex;
  min-height: 47px;
  align-items: flex-start;
  padding: 3px 0 13px 28px;
}
.production-timeline__list li:not(:last-child)::before {
  position: absolute;
  top: 15px;
  bottom: -1px;
  left: 7px;
  width: 1px;
  background: #dbe4ef;
  content: '';
}
.production-timeline__dot {
  position: absolute;
  top: 8px;
  left: 2px;
  width: 11px;
  height: 11px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
.production-timeline__item--latest .production-timeline__dot {
  background: #22c55e;
  box-shadow: 0 0 0 1px #22c55e;
}
.production-timeline__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}
.production-timeline__content strong {
  overflow: hidden;
  color: #263247;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.production-timeline__content span {
  color: #94a3b8;
  font-size: 10px;
}
.production-timeline__delete {
  flex: 0 0 auto;
  margin: -2px 0 0 8px;
}
.production-timeline__delete svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.production-timeline__empty {
  margin: 56px 0 4px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}
</style>
