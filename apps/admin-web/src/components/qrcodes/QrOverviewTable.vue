<script setup lang="ts">
import type { QrOverviewItem } from '@/api/qrcodes'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{
  items: readonly QrOverviewItem[]
  loading: boolean
  permissions: readonly string[]
  total: number
  page: number
  pageSize: number
}>()
const emit = defineEmits<{
  page: [value: number]
  view: [value: QrOverviewItem]
}>()

const has = (code: string) => props.permissions.includes(code)
const columns = computed<ConfigTableColumn[]>(() => [
  ...(has('qrcode.field.product')
    ? [
        { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 150 },
        { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 190 },
        { title: '款式', dataIndex: 'style', key: 'style', width: 130 },
      ]
    : []),
  { title: '总数', dataIndex: 'total', key: 'total', width: 120 },
  ...(has('qrcode.field.status')
    ? [
        { title: '已绑定', dataIndex: 'bound', key: 'bound', width: 120 },
        { title: '未绑定', dataIndex: 'unbound', key: 'unbound', width: 120 },
        { title: '已作废', dataIndex: 'voided', key: 'voided', width: 120 },
      ]
    : []),
  { title: '操作', key: 'actions', fixed: 'right', width: 90 },
])

const number = new Intl.NumberFormat('zh-CN')
const row = (record: Record<string, unknown>) =>
  record as unknown as QrOverviewItem
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="items as unknown as Record<string, unknown>[]"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="920"
    @change="emit('page', $event)"
  >
    <template #cell="{ column, record, value }">
      <a-tag v-if="column.key === 'bound'" color="blue">
        {{ number.format(Number(value || 0)) }}
      </a-tag>
      <a-tag v-else-if="column.key === 'unbound'" color="green">
        {{ number.format(Number(value || 0)) }}
      </a-tag>
      <a-tag v-else-if="column.key === 'voided'" color="red">
        {{ number.format(Number(value || 0)) }}
      </a-tag>
      <span v-else-if="column.key === 'total'" class="font-600 text-slate-900">
        {{ number.format(Number(value || 0)) }}
      </span>
      <a-button
        v-else-if="column.key === 'actions'"
        type="link"
        size="small"
        @click="emit('view', row(record))"
      >
        详情
      </a-button>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
