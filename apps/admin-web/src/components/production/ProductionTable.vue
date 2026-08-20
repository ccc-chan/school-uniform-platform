<script setup lang="ts">
import type { ProductionItem } from '@/api/production'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import type { ConfigOption, ConfigTableColumn } from '@/components/common/types'

const props = withDefaults(
  defineProps<{
    columns: ConfigTableColumn[]
    items: readonly ProductionItem[]
    loading: boolean
    total: number
    page: number
    pageSize: number
    statusOptions: ConfigOption[]
    canEdit?: boolean
    canChangeStatus?: boolean
  }>(),
  { canEdit: false, canChangeStatus: false },
)

const emit = defineEmits<{
  page: [value: number]
  edit: [value: ProductionItem]
  status: [value: { item: ProductionItem; status: string }]
}>()

const statusColors: Record<string, string> = {
  pending: 'default',
  scheduled: 'cyan',
  producing: 'blue',
  planned: 'cyan',
  in_progress: 'blue',
  paused: 'orange',
  completed: 'green',
  exception: 'red',
  enabled: 'green',
  disabled: 'default',
  shipped: 'blue',
  received: 'green',
  cancelled: 'red',
}

const statusLabels = computed(() =>
  Object.fromEntries(props.statusOptions.map((item) => [item.value, item.label])),
)
const row = (record: Record<string, unknown>) =>
  record as unknown as ProductionItem
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="items as unknown as Record<string, unknown>[]"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="1200"
    @change="emit('page', $event)"
  >
    <template #cell="{ column, record, value }">
      <a-select
        v-if="column.key === 'status' && canChangeStatus"
        :value="String(value || '')"
        :options="statusOptions"
        size="small"
        class="w-28"
        @change="emit('status', { item: row(record), status: String($event) })"
      />
      <a-tag
        v-else-if="column.key === 'status'"
        :color="statusColors[String(value || '')]"
      >
        {{ statusLabels[String(value || '')] || value || '-' }}
      </a-tag>
      <a-tag v-else-if="column.key === 'consumerVisible'" :color="value ? 'blue' : 'default'">
        {{ value ? '展示' : '不展示' }}
      </a-tag>
      <span
        v-else-if="column.key === 'quantity' || column.key === 'dailyCapacity'"
        class="font-600 text-slate-900"
      >
        {{ Number(value || 0).toLocaleString('zh-CN') }}
      </span>
      <a-button
        v-else-if="column.key === 'actions' && canEdit"
        type="link"
        size="small"
        @click="emit('edit', row(record))"
      >
        编辑
      </a-button>
      <span v-else-if="column.key === 'actions'" class="text-slate-400">—</span>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
