<!--
 * @Author: Chan
 * @Date: 2026-07-17 09:24:25
 * @LastEditors: chan
 * @LastEditTime: 2026-08-05 11:46:39
 * @FilePath: /school-uniform-platform/apps/admin-web/src/views/products/ProductListView.vue
 * @Description: 
 * 
-->
<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { Product, ProductQrCodeType } from '@/api/products'
import { useProducts } from '@/composables/useProducts'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/utils/modal'
const router = useRouter(),
  auth = useAuthStore()
const {
  items,
  loading,
  total,
  page,
  pageSize,
  filters,
  load,
  setFilters,
  search,
  reset,
  setPage,
  toggleStatus,
  remove,
} = useProducts()
const has = (code: string) => auth.hasPermission(code)
const safe = async (action: () => Promise<void>, fallback: string) => {
  try {
    await action()
  } catch (e) {
    message.error(e instanceof Error ? e.message : fallback)
  }
}
async function selectQrCodeType(value: ProductQrCodeType | '') {
  setFilters({ qrCodeType: value })
  await safe(search, '二维码类型筛选失败')
}
const view = (p: Product) => router.push(`/products/${p.id}`)
const edit = (p: Product) => router.push(`/products/${p.id}/edit`)
const toggle = (p: Product) =>
  safe(async () => {
    await toggleStatus(p)
    message.success('产品状态已更新')
  }, '状态更新失败')
const destroy = (p: Product) =>
  confirmAction({
    title: '确认删除产品',
    content: `确定删除“${p.name || p.code}”吗？`,
    okType: 'danger',
    async onOk() {
      await remove(p)
      message.success('产品已删除')
    },
  })
onMounted(() => safe(load, '产品数据加载失败'))
</script>
<template>
  <section class="product-list-page">
    <header class="product-list-page__header">
      <div>
        <h2 class="page-title">产品列表</h2>
        <p class="product-list-page__subtitle">维护产品信息与启用状态</p>
      </div>
      <a-button
        v-if="has('product.create')"
        class="product-list-page__create"
        type="primary"
        @click="router.push('/products/new')"
      >
        <span aria-hidden="true">＋</span>
        新建产品
      </a-button>
    </header>

    <div class="product-list-page__filters">
      <ProductFilters
        :filters="filters"
        :loading="loading"
        @update:filters="setFilters"
        @search="safe(search, '查询失败')"
        @reset="safe(reset, '重置失败')"
      />
    </div>

    <ProductQrTypeTabs
      :value="filters.qrCodeType"
      :loading="loading"
      @select="selectQrCodeType"
    />

    <div class="product-list-page__results">
      <ProductTable
        :items="items"
        :loading="loading"
        :permissions="auth.permissions"
        :can-edit="has('product.edit')"
        :can-status="has('product.status')"
        :can-delete="has('product.delete')"
        @view="view"
        @edit="edit"
        @toggle="toggle"
        @delete="destroy"
      />
      <div
        v-if="total"
        class="product-list-page__pagination"
      >
        <span>共 {{ total }} 个产品</span>
        <a-pagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          @change="(value) => safe(() => setPage(value), '加载失败')"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-list-page {
  display: flex;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding-bottom: 16px;
  flex-direction: column;
  gap: 18px;
}

.product-list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.product-list-page__subtitle {
  margin: 6px 0 0;
  color: #7c8da5;
  font-size: 13px;
}

.product-list-page__create {
  height: 40px;
  padding-inline: 18px;
  border-radius: 10px;
  box-shadow: 0 8px 18px rgb(37 99 235 / 22%);
  font-weight: 600;
}

.product-list-page__create span {
  margin-right: 4px;
  font-size: 18px;
  line-height: 1;
}

.product-list-page__filters {
  padding: 16px;
  border: 1px solid #dce5f1;
  border-radius: 16px;
  background: #fff;
}

.product-list-page__results {
  min-width: 0;
}

.product-list-page__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding-inline: 4px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 639px) {
  .product-list-page__header {
    align-items: flex-start;
  }

  .product-list-page__create {
    padding-inline: 12px;
  }

  .product-list-page__filters {
    padding: 12px;
  }

  .product-list-page__pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
