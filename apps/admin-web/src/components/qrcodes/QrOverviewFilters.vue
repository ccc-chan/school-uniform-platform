<script setup lang="ts">
import type { QrOverviewFilters, QrStatus } from '@/api/qrcodes'
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'

const props = defineProps<{
  filters: QrOverviewFilters
  loading: boolean
}>()
const emit = defineEmits<{
  'update:filters': [value: QrOverviewFilters]
  search: []
  reset: []
}>()

function patch(value: Partial<QrOverviewFilters>) {
  emit('update:filters', { ...props.filters, ...value })
}

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '未绑定', value: 'unbound' },
  { label: '已绑定', value: 'bound' },
  { label: '已激活', value: 'activated' },
  { label: '已作废', value: 'voided' },
]

function selectStatus(value: unknown) {
  const status = String(value || '')
  const allowed: Array<QrStatus | ''> = ['', 'unbound', 'bound', 'activated', 'voided']
  if (allowed.includes(status as QrStatus | '')) {
    patch({ status: status as QrStatus | '' })
  }
}
</script>

<template>
  <QueryFilterBar
    class="qr-filters"
    :loading="loading"
    actions-at-end
    reset-first
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <a-form-item label="产品">
      <a-input
        :value="filters.keyword"
        allow-clear
        placeholder="请输入产品名称或编号"
        @update:value="patch({ keyword: $event })"
        @press-enter="emit('search')"
      />
    </a-form-item>
    <a-form-item label="状态">
      <a-select
        :value="filters.status"
        :options="statusOptions"
        class="w-36"
        @update:value="selectStatus"
      />
    </a-form-item>
  </QueryFilterBar>
</template>

<style scoped>
.qr-filters {
  display: flex;
  gap: 8px 0;
}

.qr-filters :deep(.ant-input) {
  width: 240px;
}

@media (max-width: 767px) {
  .qr-filters,
  .qr-filters :deep(.ant-form-item),
  .qr-filters :deep(.ant-input),
  .qr-filters :deep(.ant-select) {
    width: 100%;
  }
}
</style>
