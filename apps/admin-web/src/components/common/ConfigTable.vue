<script setup lang="ts">
import type { ConfigTableColumn } from './types'

withDefaults(
  defineProps<{
    columns: ConfigTableColumn[]
    items: Record<string, unknown>[]
    loading?: boolean
    rowKey?: string
    total?: number
    page?: number
    pageSize?: number
    scrollX?: number | string
    size?: 'small' | 'middle' | 'large'
  }>(),
  {
    loading: false,
    rowKey: 'id',
    total: 0,
    page: 1,
    pageSize: 10,
    scrollX: undefined,
  },
)

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  change: [page: number, pageSize: number]
}>()

function changePage(page: number, pageSize: number) {
  emit('update:page', page)
  emit('update:pageSize', pageSize)
  emit('change', page, pageSize)
}

function getCellValue(
  record: Record<string, unknown>,
  dataIndex: string | number | readonly (string | number)[] | undefined,
  key: string | number | symbol | undefined,
) {
  const index = dataIndex ?? key
  if (Array.isArray(index)) {
    return index.reduce<unknown>((value, currentKey) => {
      if (!value || typeof value !== 'object') return undefined
      return (value as Record<string | number, unknown>)[currentKey]
    }, record)
  }
  return typeof index === 'string' || typeof index === 'number'
    ? record[index]
    : undefined
}
</script>

<template>
  <div class="config-table">
    <a-table
      :columns="columns"
      :data-source="items"
      :loading="loading"
      :pagination="false"
      :row-key="rowKey"
      :size="size"
      :scroll="scrollX ? { x: scrollX } : undefined"
    >
      <template #bodyCell="{ column, record, index }">
        <slot
          name="cell"
          :column="column"
          :record="record"
          :index="index"
          :value="getCellValue(record, column.dataIndex, column.key)"
        >
          <OverflowTooltip
            :content="getCellValue(record, column.dataIndex, column.key)"
          />
        </slot>
      </template>

      <template #emptyText>
        <slot name="empty">
          <a-empty />
        </slot>
      </template>
    </a-table>

    <div v-if="total > 0" class="config-table__pagination">
      <a-pagination
        :current="page"
        :page-size="pageSize"
        :total="total"
        size="small"
        @change="changePage"
      />
    </div>
  </div>
</template>

<style scoped>
.config-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
