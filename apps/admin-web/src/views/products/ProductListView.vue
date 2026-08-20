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
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="page-title">产品列表</h2>
          <p class="mb-0 mt-2 text-secondary">维护产品信息与启用状态</p>
        </div>
        <a-button
          v-if="has('product.create')"
          type="primary"
          @click="router.push('/products/new')"
          >新建产品</a-button
        >
      </div>
      <ProductFilters
        class="mt-5"
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

    <div>
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
        class="mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>共 {{ total }} 个产品</span
        ><a-pagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          @change="(value) => safe(() => setPage(value), '加载失败')"
        />
      </div>
    </div>
  </section>
</template>
