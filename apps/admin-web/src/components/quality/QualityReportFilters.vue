<script setup lang="ts">
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'
import type { ConfigOption } from '@/components/common/types'

defineProps<{
  keyword: string
  productId: string
  status: string
  startDate: string
  endDate: string
  productOptions: ConfigOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:productId': [value: string]
  'update:status': [value: string]
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  search: []
  reset: []
}>()

const statusOptions: ConfigOption[] = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已过期', value: 'expired' },
]
</script>

<template>
  <QueryFilterBar
    class="quality-filters"
    :loading="loading"
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <a-input
      :value="keyword"
      allow-clear
      class="quality-filters__keyword"
      placeholder="报告编号、名称、机构或检测编号"
      @press-enter="emit('search')"
      @update:value="emit('update:keyword', $event)"
    />
    <a-select
      :value="productId"
      :options="[{ label: '全部产品', value: '' }, ...productOptions]"
      show-search
      option-filter-prop="label"
      class="quality-filters__select"
      @update:value="emit('update:productId', String($event || ''))"
    />
    <a-select
      :value="status"
      :options="statusOptions"
      class="quality-filters__select"
      @update:value="emit('update:status', String($event || ''))"
    />
    <div class="quality-filters__dates">
      <a-input
        type="date"
        :value="startDate"
        aria-label="检测开始日期"
        @update:value="emit('update:startDate', $event)"
      />
      <span class="text-slate-400">至</span>
      <a-input
        type="date"
        :value="endDate"
        aria-label="检测结束日期"
        @update:value="emit('update:endDate', $event)"
      />
    </div>
  </QueryFilterBar>
</template>

<style scoped>
.quality-filters {
  align-items: center;
}

.quality-filters__keyword {
  width: min(100%, 300px);
}

.quality-filters__select {
  width: 180px;
}

.quality-filters__dates {
  display: flex;
  width: 310px;
  align-items: center;
  gap: 8px;
}

@media (max-width: 639px) {
  .quality-filters__keyword,
  .quality-filters__select,
  .quality-filters__dates {
    width: 100%;
  }
}
</style>
