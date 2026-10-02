<script setup lang="ts">
import type { ProductionOrderFilters } from '@/api/production'
import { productQrCodeTypeOptions, productSafetyCategoryOptions } from '@/api/products'
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'

const props = defineProps<{ filters: ProductionOrderFilters; loading: boolean }>()
const emit = defineEmits<{ 'update:filters': [value: Partial<ProductionOrderFilters>]; search: []; reset: [] }>()
function update<Key extends keyof ProductionOrderFilters>(key: Key, value: ProductionOrderFilters[Key]) { emit('update:filters', { [key]: value }) }
const statusOptions = [{ label: '全部状态', value: '' }, { label: '待生产', value: 'pending' }, { label: '生产中', value: 'producing' }, { label: '已完工', value: 'completed' }, { label: '已入库', value: 'warehoused' }]
</script>

<template>
  <QueryFilterBar :loading="loading" @search="emit('search')" @reset="emit('reset')">
    <a-input :value="props.filters.keyword" allow-clear class="filter-control" placeholder="名称 / 产品编号" @press-enter="emit('search')" @update:value="update('keyword', String($event || ''))" />
    <a-input :value="props.filters.batchNo" allow-clear class="filter-control" placeholder="批次" @press-enter="emit('search')" @update:value="update('batchNo', String($event || ''))" />
    <a-select :value="props.filters.safetyCategory" allow-clear class="filter-control filter-control--wide" placeholder="安全类别" :options="productSafetyCategoryOptions" @update:value="update('safetyCategory', String($event || ''))" />
    <a-select :value="props.filters.qrCodeType" allow-clear class="filter-control" placeholder="赋码模式" :options="productQrCodeTypeOptions" @update:value="update('qrCodeType', String($event || ''))" />
    <a-select :value="props.filters.qualityReport" class="filter-control" :options="[{ label: '全部质检报告', value: '' }, { label: '已上传报告', value: 'uploaded' }, { label: '未上传报告', value: 'missing' }]" @update:value="update('qualityReport', String($event || ''))" />
    <a-select :value="props.filters.status" class="filter-control" :options="statusOptions" @update:value="update('status', String($event || ''))" />
  </QueryFilterBar>
</template>

<style scoped>
.filter-control{width:180px}.filter-control--wide{width:280px}@media(max-width:1023px){.filter-control,.filter-control--wide{width:100%}}
</style>
