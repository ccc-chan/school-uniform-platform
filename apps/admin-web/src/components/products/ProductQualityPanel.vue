<script setup lang="ts">
import type { ProductQualityReport } from '@/api/products'

defineProps<{
  reports: readonly ProductQualityReport[]
  canView: boolean
  canPreview: boolean
  canUpload: boolean
  canDelete: boolean
  deletingId: number | null
}>()

const emit = defineEmits<{
  preview: [id: number]
  upload: []
  remove: [id: number]
}>()

const conclusionMeta = {
  qualified: { label: '合格', className: 'quality-panel__badge--success' },
  unqualified: { label: '不合格', className: 'quality-panel__badge--danger' },
} as const

function reportConclusion(report: ProductQualityReport) {
  if (report.conclusion) {
    return conclusionMeta[report.conclusion]
  }
  return { label: '未知', className: 'quality-panel__badge--expired' }
}
</script>

<template>
  <section class="quality-panel">
    <header class="quality-panel__header">
      <h3>质检报告</h3>
      <a-button v-if="canUpload" @click="emit('upload')">上传</a-button>
    </header>

    <p v-if="!canView" class="quality-panel__empty">
      当前账号没有质检报告查看权限
    </p>

    <div v-else-if="reports.length" class="quality-panel__list">
      <article v-for="report in reports" :key="report.id">
        <span
          class="quality-panel__badge"
          :class="reportConclusion(report).className"
        >
          {{ reportConclusion(report).label }}
        </span>
        <div class="quality-panel__copy">
          <strong>{{ report.name }}</strong>
          <span>{{ report.fileName || '检测报告.pdf' }}</span>
        </div>
        <div class="quality-panel__actions">
          <button
            v-if="canPreview"
            type="button"
            class="quality-panel__link"
            @click="emit('preview', report.id)"
          >
            预览
          </button>
          <a-popconfirm
            v-if="canDelete"
            title="确定删除这份质检报告吗？"
            ok-text="确认"
            cancel-text="取消"
            @confirm="emit('remove', report.id)"
          >
            <button
              type="button"
              class="quality-panel__link quality-panel__link--danger"
              :disabled="deletingId === report.id"
            >
              {{ deletingId === report.id ? '删除中' : '删除' }}
            </button>
          </a-popconfirm>
        </div>
      </article>
    </div>

    <p v-else class="quality-panel__empty">该产品暂无质检报告</p>
  </section>
</template>

<style scoped>
.quality-panel {
  min-height: 248px;
  border: 1px solid #dfe7f1;
  border-radius: 14px;
  background: #fff;
  padding: 18px 20px;
}
.quality-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.quality-panel__header h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
}
.quality-panel__header :deep(.ant-btn) {
  height: 30px;
  border-radius: 8px;
  color: #526078;
  font-size: 11px;
}
.quality-panel__list {
  display: flex;
  margin-top: 16px;
  flex-direction: column;
  gap: 10px;
}
.quality-panel__list article {
  display: grid;
  min-height: 46px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid #edf1f6;
  border-radius: 10px;
  padding: 8px 12px;
}
.quality-panel__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.quality-panel__copy strong,
.quality-panel__copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quality-panel__copy strong {
  color: #263247;
  font-size: 12px;
}
.quality-panel__copy span {
  color: #94a3b8;
  font-size: 10px;
}
.quality-panel__badge {
  border-radius: 5px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 600;
}
.quality-panel__badge--success {
  color: #16803c;
  background: #edf9f0;
}
.quality-panel__badge--danger {
  color: #dc2626;
  background: #fef2f2;
}
.quality-panel__badge--expired {
  color: #64748b;
  background: #f1f5f9;
}
.quality-panel__link {
  border: 0;
  background: transparent;
  padding: 0;
  color: #2563eb;
  font-size: 11px;
  cursor: pointer;
}
.quality-panel__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.quality-panel__link--danger {
  color: #ef4444;
}
.quality-panel__link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.quality-panel__empty {
  margin: 56px 0 4px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}
</style>
