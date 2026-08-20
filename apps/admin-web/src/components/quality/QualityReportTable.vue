<script setup lang="ts">
import type { QualityReport } from '@/api/quality'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import type { ConfigTableColumn } from '@/components/common/types'
import { QUALITY_REPORT_STATUS_MAP } from '@/constants/status'

withDefaults(defineProps<{
  items: readonly QualityReport[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  canDownload?: boolean
}>(), { canDownload: false })

const emit = defineEmits<{
  page: [value: number]
  view: [value: QualityReport]
  preview: [value: QualityReport]
}>()

const columns: ConfigTableColumn[] = [
  { title: '报告编号', dataIndex: 'reportNo', key: 'reportNo', width: 190 },
  { title: '报告名称', dataIndex: 'name', key: 'name', width: 210 },
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 170 },
  { title: '检测机构', dataIndex: 'institution', key: 'institution', width: 200 },
  { title: '检测日期', dataIndex: 'inspectionDate', key: 'inspectionDate', width: 125 },
  { title: '有效期至', dataIndex: 'validUntil', key: 'validUntil', width: 125 },
  { title: '检测结论', dataIndex: 'conclusion', key: 'conclusion', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 105 },
  { title: '操作', key: 'actions', fixed: 'right', width: 150 },
]

const conclusionMap: Record<string, { label: string; color: string }> = {
  qualified: { label: '合格', color: 'green' },
  unqualified: { label: '不合格', color: 'red' },
}

const row = (record: Record<string, unknown>) =>
  record as unknown as QualityReport
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="items as unknown as Record<string, unknown>[]"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="1400"
    @change="emit('page', $event)"
  >
    <template #cell="{ column, record, value }">
      <StatusTag
        v-if="column.key === 'status'"
        :value="String(value || '')"
        :map="QUALITY_REPORT_STATUS_MAP"
      />
      <a-tag
        v-else-if="column.key === 'conclusion'"
        :color="conclusionMap[String(value || '')]?.color"
      >
        {{ conclusionMap[String(value || '')]?.label || '-' }}
      </a-tag>
      <a-space v-else-if="column.key === 'actions'" :size="4">
        <a-button type="link" size="small" @click="emit('view', row(record))">
          详情
        </a-button>
        <a-button
          v-if="canDownload"
          type="link"
          size="small"
          @click="emit('preview', row(record))"
        >
          查看报告
        </a-button>
      </a-space>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
