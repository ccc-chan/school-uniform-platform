<script setup lang="ts">
import { computed } from 'vue'
import ConfigForm from '@/components/common/ConfigForm.vue'
import type { QrManagementFilters } from '@/api/qr-management'
import { getFilterFields } from './config'

const props = defineProps<{ filters: QrManagementFilters; loading: boolean }>()
const emit = defineEmits<{
  'update:filters': [value: QrManagementFilters]
  search: []
  reset: []
}>()

const filterModel = computed<Record<string, unknown>>({
  get: () => props.filters as unknown as Record<string, unknown>,
  set: (val: Record<string, unknown>) => {
    const newVal = { ...val } as unknown as QrManagementFilters
    if (newVal.province !== props.filters.province) {
      newVal.city = ''
      newVal.district = ''
    } else if (newVal.city !== props.filters.city) {
      newVal.district = ''
    }
    emit('update:filters', newVal)
  },
})

const fields = computed(() =>
  getFilterFields(props.filters, () => emit('search')),
)
</script>

<template>
  <ConfigForm
    v-model="filterModel"
    layout="inline"
    class="qr-filters query-filter-bar"
    :fields="fields"
  >
    <a-form-item
      class="query-filter-bar__actions query-filter-bar__actions--end"
    >
      <a-space>
        <a-button type="primary" :loading="loading" @click="emit('search')"
          >查询</a-button
        >
        <a-button :disabled="loading" @click="emit('reset')">重置</a-button>
      </a-space>
    </a-form-item>
  </ConfigForm>
</template>

<style scoped>
.query-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.query-filter-bar :deep(.ant-form-item) {
  margin: 0;
}
.query-filter-bar__actions--end {
  margin-inline-start: auto;
}
@media (max-width: 639px) {
  .query-filter-bar__actions {
    width: 100%;
  }
  .query-filter-bar__actions--end {
    margin-inline-start: 0;
  }
}

.qr-filters :deep(.qr-filters__text) {
  flex: 1 1 240px;
  min-width: 0;
}
.qr-filters :deep(.qr-filters__select) {
  flex: 0 1 180px;
  min-width: 150px;
}
.qr-filters :deep(.ant-select) {
  width: 100%;
}
.qr-filters :deep(.ant-input-affix-wrapper),
.qr-filters :deep(.ant-select-selector),
.qr-filters :deep(.ant-btn) {
  min-height: 40px;
  border-radius: 8px;
}
.qr-filters :deep(.ant-select-selector) {
  align-items: center;
}
.qr-filters :deep(.ant-form-item-label) {
  display: flex;
  align-items: center;
}
@media (max-width: 639px) {
  .qr-filters :deep(.qr-filters__text),
  .qr-filters :deep(.qr-filters__select) {
    flex-basis: 100%;
  }
}
</style>
