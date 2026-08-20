<!--
 * @Author: Chan
 * @Date: 2026-07-17 08:52:28
 * @LastEditors: chan
 * @LastEditTime: 2026-08-17 10:47:30
 * @FilePath: /school-uniform-platform/apps/admin-web/src/components/products/ProductFilters.vue
 * @Description: 
 * 
-->
<script setup lang="ts">
import {
  productCategoryOptions,
  type ProductCategory,
  type ProductFilters,
  type ProductStatus,
} from '@/api/products'
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'

const props = defineProps<{
  filters: ProductFilters
  loading: boolean
}>()

const emit = defineEmits<{
  'update:filters': [value: ProductFilters]
  search: []
  reset: []
}>()

function updateFilter<Key extends keyof ProductFilters>(
  key: Key,
  value: ProductFilters[Key],
) {
  emit('update:filters', { ...props.filters, [key]: value })
}
</script>

<template>
  <QueryFilterBar
    class="product-filters"
    :loading="loading"
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <a-form-item class="product-filters__item">
      <a-input
        :value="filters.keyword"
        allow-clear
        placeholder="搜索产品名称、编号"
        @update:value="updateFilter('keyword', $event)"
        @press-enter="emit('search')"
      />
    </a-form-item>
    <a-form-item class="product-filters__item product-filters__item--select">
      <a-select
        :value="filters.category || undefined"
        allow-clear
        placeholder="全部分类"
        :options="productCategoryOptions"
        @update:value="
          updateFilter('category', ($event ?? '') as ProductCategory | '')
        "
      />
    </a-form-item>
    <a-form-item class="product-filters__item product-filters__item--select">
      <a-select
        :value="filters.status || undefined"
        allow-clear
        placeholder="全部状态"
        :options="[
          { label: '已启用', value: 'enabled' },
          { label: '已停用', value: 'disabled' },
        ]"
        @update:value="
          updateFilter('status', ($event ?? '') as ProductStatus | '')
        "
      />
    </a-form-item>
  </QueryFilterBar>
</template>

<style scoped>
.product-filters__item {
  width: 280px;
  margin: 0;
}

.product-filters__item--select {
  width: 160px;
}

.product-filters :deep(.ant-form-item-control),
.product-filters :deep(.ant-input),
.product-filters :deep(.ant-select) {
  width: 100%;
}

@media (max-width: 639px) {
  .product-filters__item,
  .product-filters__item--select {
    width: 100%;
  }
}
</style>
