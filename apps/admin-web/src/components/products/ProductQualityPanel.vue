<script setup lang="ts">
import type { ProductQualityReport } from '@/api/products'

defineProps<{
  reports: readonly ProductQualityReport[]
  canView: boolean
  canPreview: boolean
}>()

const emit = defineEmits<{
  preview: [id: number]
}>()

const conclusionMeta = {
  qualified: { label: '合格', className: 'quality-panel__badge--success' },
  unqualified: { label: '不合格', className: 'quality-panel__badge--danger' },
} as const

function reportConclusion(report: ProductQualityReport) {
  if (report.conclusion) return conclusionMeta[report.conclusion]
  return { label: '待审核', className: 'quality-panel__badge--pending' }
}
</script>

<template>
  <section class="quality-panel">
    <header class="quality-panel__header">
      <h3>质检报告</h3>
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
        <strong>{{ report.name }}</strong>
        <span class="quality-panel__file">{{ report.fileName || '检测报告.pdf' }}</span>
        <button
          v-if="canPreview"
          type="button"
          class="quality-panel__link"
          @click="emit('preview', report.id)"
        >
          预览
        </button>
      </article>
    </div>

    <p v-else class="quality-panel__empty">该产品暂无质检报告</p>
  </section>
</template>

<style scoped>
.quality-panel{border:1px solid #dfe7f1;border-radius:14px;background:#fff;padding:16px}.quality-panel__header{display:flex;align-items:center;justify-content:space-between;gap:20px}.quality-panel__header h3{margin:0;color:#172033;font-size:14px}.quality-panel__list{margin-top:12px;border:1px solid #edf1f6;border-radius:10px;overflow:hidden}.quality-panel__list article{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(120px,auto) auto;align-items:center;gap:12px;padding:11px 12px}.quality-panel__list article+article{border-top:1px solid #edf1f6}.quality-panel__list strong{overflow:hidden;color:#263247;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.quality-panel__badge{border-radius:5px;padding:3px 7px;font-size:11px;font-weight:600}.quality-panel__badge--success{color:#16803c;background:#edf9f0}.quality-panel__badge--danger{color:#dc2626;background:#fef2f2}.quality-panel__badge--pending{color:#b45309;background:#fff7ed}.quality-panel__file{overflow:hidden;color:#8190a7;font-size:11px;text-align:right;text-overflow:ellipsis;white-space:nowrap}.quality-panel__link{border:0;background:transparent;padding:0;color:#2563eb;font-size:12px;cursor:pointer}.quality-panel__empty{margin:18px 0 4px;color:#94a3b8;font-size:12px;text-align:center}@media(max-width:640px){.quality-panel__list article{grid-template-columns:auto minmax(0,1fr) auto}.quality-panel__file{display:none}}
</style>
