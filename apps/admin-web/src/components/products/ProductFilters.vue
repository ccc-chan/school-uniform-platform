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
    actions-at-end
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <a-form-item
      class="product-filters__item product-filters__item--keyword"
    >
      <a-input
        :value="filters.keyword"
        allow-clear
        placeholder="搜索产品名称、编号"
        @update:value="updateFilter('keyword', $event)"
        @press-enter="emit('search')"
      >
        <template #prefix>
          <svg
            class="product-filters__search-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
        </template>
      </a-input>
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
  min-width: 0;
  margin: 0;
}

.product-filters__item--keyword {
  min-width: 280px;
  flex: 1;
}

.product-filters__item--select {
  width: 120px;
}

.product-filters :deep(.ant-form-item-control),
.product-filters :deep(.ant-input),
.product-filters :deep(.ant-select) {
  width: 100%;
}

.product-filters__search-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #91a2b8;
  stroke-linecap: round;
  stroke-width: 1.7;
}

.product-filters :deep(.ant-input-affix-wrapper),
.product-filters :deep(.ant-select-selector),
.product-filters :deep(.ant-btn) {
  min-height: 40px;
  border-radius: 10px;
}

.product-filters :deep(.ant-select-selector) {
  display: flex;
  align-items: center;
}

.product-filters :deep(.query-filter-bar__actions .ant-btn) {
  min-width: 68px;
  padding-inline: 16px;
}

@media (max-width: 959px) {
  .product-filters__item--keyword {
    width: 100%;
    flex-basis: 100%;
  }

  .product-filters__item--select {
    flex: 1;
  }
}

@media (max-width: 639px) {
  .product-filters__item,
  .product-filters__item--select {
    width: 100%;
    flex-basis: 100%;
  }

  .product-filters :deep(.query-filter-bar__actions .ant-space) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .product-filters :deep(.query-filter-bar__actions .ant-btn) {
    width: 100%;
  }
}
</style>
