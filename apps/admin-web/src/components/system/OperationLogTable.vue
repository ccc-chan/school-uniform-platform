<script setup lang="ts">
import type { OperationLog } from '@/types/system'

const props = defineProps<{
  items: OperationLog[]
  loading: boolean
  total: number
  page: number
  pageSize: number
}>()
const emit = defineEmits<{
  detail: [value: OperationLog]
  page: [value: number]
}>()
const columns = [
  { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 180 },
  { title: '模块', dataIndex: 'module', key: 'module', width: 120 },
  { title: '操作行为', dataIndex: 'action', key: 'action', width: 140 },
  { title: '目标', key: 'target', width: 150 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 140 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 90 },
]
const tableItems = computed(() => props.items as unknown as Record<string, unknown>[])

function getTargetText(record: Record<string, unknown>) {
  return record.targetId
    ? `${record.targetType} #${record.targetId}`
    : record.targetType
}
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="tableItems"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="1000"
    @change="emit('page', $event)"
  >
    <template #cell="{ column, record, value }">
      <OverflowTooltip
        v-if="column.key === 'target'"
        :content="getTargetText(record)"
      />
      <a-button v-else-if="column.key === 'actions'" type="link" size="small" @click="emit('detail', record as unknown as OperationLog)">详情</a-button>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
