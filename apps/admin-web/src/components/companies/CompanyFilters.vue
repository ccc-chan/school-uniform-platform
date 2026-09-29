<script setup lang="ts">
import type { CompanyFilters } from '@/api/companies'
const props = defineProps<{ filters: CompanyFilters; loading: boolean }>()
const emit = defineEmits<{ 'update:filters': [value: Partial<CompanyFilters>]; search: []; reset: [] }>()
function updateStatus(value: unknown) {
  emit('update:filters', { status: value === 'enabled' || value === 'disabled' ? value : '' })
}
</script>

<template>
  <div class="company-filters">
    <a-input :value="props.filters.keyword" allow-clear placeholder="公司名称 / 品牌名称 / 信用代码" @update:value="emit('update:filters', { keyword: $event })" @press-enter="emit('search')" />
    <a-select :value="props.filters.status || undefined" allow-clear placeholder="全部状态" :options="[{ label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }]" @update:value="updateStatus" />
    <a-button type="primary" :loading="loading" @click="emit('search')">查询</a-button>
    <a-button :disabled="loading" @click="emit('reset')">重置</a-button>
  </div>
</template>

<style scoped>.company-filters{display:grid;grid-template-columns:minmax(240px,1fr) 180px auto auto;gap:12px}@media(max-width:700px){.company-filters{grid-template-columns:1fr 1fr}.company-filters :first-child{grid-column:1/-1}}</style>
