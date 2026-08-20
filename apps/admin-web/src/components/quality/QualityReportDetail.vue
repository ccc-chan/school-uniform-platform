<script setup lang="ts">
import type { QualityReport, QualityResultItem } from '@/api/quality'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import type { ConfigTableColumn } from '@/components/common/types'
import { QUALITY_REPORT_STATUS_MAP } from '@/constants/status'

const props = defineProps<{
  report: QualityReport
  canReview: boolean
  canDownload: boolean
  reviewing: boolean
}>()

const resultRows = computed(() => [...(props.report.resultItems || [])])

const resultColumns: ConfigTableColumn[] = [
  { title: '项目编号', dataIndex: 'code', key: 'code', width: 145 },
  { title: '检测项目', dataIndex: 'name', key: 'name', width: 170 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 130 },
  {
    title: '标准要求',
    dataIndex: 'standardRequirement',
    key: 'standardRequirement',
    width: 260,
  },
  {
    title: '检测结果',
    dataIndex: 'resultValue',
    key: 'resultValue',
    width: 150,
  },
  { title: '结论', dataIndex: 'conclusion', key: 'conclusion', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 180 },
]

const resultRow = (record: Record<string, unknown>) =>
  record as unknown as QualityResultItem

const emit = defineEmits<{
  download: []
  review: [status: 'approved' | 'rejected']
}>()

function formatSize(size: number) {
  if (!size) return '-'
  return size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`
}
</script>

<template>
  <div class="quality-detail">
    <div class="quality-detail__hero">
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="m-0 text-xl font-700 text-slate-900">{{ report.name }}</h2>
          <StatusTag
            :value="report.status"
            :map="QUALITY_REPORT_STATUS_MAP"
          />
        </div>
        <div class="mt-2 text-sm text-slate-500">
          报告编号：{{ report.reportNo }} · 检测编号：{{ report.inspectionNo }}
        </div>
      </div>
      <a-space v-if="report.status === 'pending' && canReview" wrap>
        <a-button
          danger
          :loading="reviewing"
          @click="emit('review', 'rejected')"
        >
          驳回
        </a-button>
        <a-button
          type="primary"
          :loading="reviewing"
          @click="emit('review', 'approved')"
        >
          审核通过
        </a-button>
      </a-space>
    </div>

    <div class="quality-detail__grid">
      <div class="page-card quality-detail__metadata">
        <h3 class="quality-detail__title">报告信息</h3>
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="受检产品">
            {{ report.productCode }} · {{ report.productName }}
          </a-descriptions-item>
          <a-descriptions-item label="检测机构">
            {{ report.institution || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="检测日期">
            {{ report.inspectionDate || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="有效期至">
            {{ report.validUntil || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="检测结论">
            <a-tag :color="report.conclusion === 'qualified' ? 'green' : 'red'">
              {{ report.conclusion === 'qualified' ? '合格' : '不合格' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交人员">
            {{ report.submitterName }}
          </a-descriptions-item>
          <a-descriptions-item label="审核人员">
            {{ report.reviewerName }}
          </a-descriptions-item>
          <a-descriptions-item label="审核时间">
            {{ report.reviewedAt || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="报告备注">
            <span class="whitespace-pre-wrap">{{ report.remarks || '-' }}</span>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <div class="page-card quality-detail__file">
        <div class="quality-detail__pdf-icon">PDF</div>
        <div class="mt-5 max-w-full font-600 text-slate-900">
          {{ report.fileName }}
        </div>
        <div class="mt-2 text-sm text-slate-400">
          {{ formatSize(report.fileSize) }}
        </div>
        <a-button
          v-if="canDownload"
          type="primary"
          class="mt-5"
          @click="emit('download')"
        >
          查看 PDF 报告
        </a-button>
      </div>
    </div>

    <div class="page-card">
      <h3 class="quality-detail__title">检测项目结果</h3>
      <ConfigTable
        :columns="resultColumns"
        :items="resultRows as unknown as Record<string, unknown>[]"
        row-key="itemId"
        :scroll-x="1150"
      >
        <template #cell="{ column, record, value }">
          <span
            v-if="column.key === 'resultValue'"
            class="font-600 text-slate-900"
          >
            {{ resultRow(record).resultValue }} {{ resultRow(record).unit }}
          </span>
          <a-tag
            v-else-if="column.key === 'conclusion'"
            :color="
              resultRow(record).conclusion === 'qualified' ? 'green' : 'red'
            "
          >
            {{
              resultRow(record).conclusion === 'qualified'
                ? '合格'
                : '不合格'
            }}
          </a-tag>
          <OverflowTooltip v-else :content="value" />
        </template>
      </ConfigTable>
    </div>
  </div>
</template>

<style scoped>
.quality-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-detail__hero {
  display: flex;
  padding: 22px 24px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fff 0%, #f2f7ff 100%);
  box-shadow: 0 8px 24px rgb(36 78 140 / 6%);
}

.quality-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 16px;
}

.quality-detail__title {
  margin: 0 0 18px;
  color: #172033;
  font-size: 16px;
}

.quality-detail__file {
  display: flex;
  min-height: 310px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  text-align: center;
}

.quality-detail__pdf-icon {
  display: flex;
  width: 92px;
  height: 116px;
  align-items: center;
  justify-content: center;
  border-radius: 8px 18px 8px 8px;
  color: #dc2626;
  background: #fff1f1;
  font-size: 24px;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px #fecaca;
}

@media (max-width: 899px) {
  .quality-detail__grid {
    grid-template-columns: 1fr;
  }

  .quality-detail__file {
    min-height: 240px;
  }
}

@media (max-width: 639px) {
  .quality-detail__hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
