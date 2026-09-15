<script setup lang="ts">
import { computed } from 'vue'
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'
import { qrManagementStatusMap } from '@/api/qr-management'
import type { QrManagementFilters, QrManagementStatus } from '@/api/qr-management'

const props = defineProps<{ filters: QrManagementFilters; schools: string[]; loading: boolean }>()
const emit = defineEmits<{
  'update:filters': [value: QrManagementFilters]
  search: []
  reset: []
}>()
const fields = [
  { key: 'code', label: '二维码ID', placeholder: '输入二维码ID，支持模糊查询', max: 100 },
  { key: 'studentName', label: '学生姓名', placeholder: '输入学生姓名，支持模糊查询', max: 100 },
  { key: 'phone', label: '手机号', placeholder: '输入手机号或部分数字', max: 11 },
] as const
const schools = computed(() => props.schools.map((name) => ({ value: name, label: name })))
const statuses = Object.entries(qrManagementStatusMap).map(([value, item]) => ({ value, label: item.label }))
function update<Key extends keyof QrManagementFilters>(key: Key, value: QrManagementFilters[Key]) {
  emit('update:filters', { ...props.filters, [key]: value })
}
</script>

<template>
  <QueryFilterBar class="qr-filters" :loading="loading" actions-at-end @search="emit('search')" @reset="emit('reset')">
    <a-form-item v-for="field in fields" :key="field.key" :label="field.label" class="qr-filters__text">
      <a-input :value="filters[field.key]" :aria-label="field.label" :placeholder="field.placeholder" :maxlength="field.max" allow-clear
        :inputmode="field.key === 'phone' ? 'numeric' : 'text'"
        @update:value="update(field.key, $event)" @press-enter="emit('search')" />
    </a-form-item>
    <a-form-item label="学校" class="qr-filters__select">
      <a-select :value="filters.schoolName || undefined" :options="schools" placeholder="全部学校" allow-clear show-search
        @update:value="update('schoolName', String($event || ''))" />
    </a-form-item>
    <a-form-item label="状态" class="qr-filters__select">
      <a-select :value="filters.status || undefined" :options="statuses" placeholder="全部状态" allow-clear
        @update:value="update('status', ($event || '') as QrManagementStatus | '')" />
    </a-form-item>
  </QueryFilterBar>
</template>

<style scoped>
.qr-filters__text { flex: 1 1 240px; min-width: 0; }
.qr-filters__select { flex: 0 1 180px; min-width: 150px; }
.qr-filters :deep(.ant-select) { width: 100%; }
.qr-filters :deep(.ant-input-affix-wrapper),
.qr-filters :deep(.ant-select-selector),
.qr-filters :deep(.ant-btn) { min-height: 40px; border-radius: 8px; }
.qr-filters :deep(.ant-select-selector) { align-items: center; }
.qr-filters :deep(.ant-form-item-label) { display: flex; align-items: center; }
@media (max-width: 639px) {
  .qr-filters__text, .qr-filters__select { flex-basis: 100%; }
}
</style>
