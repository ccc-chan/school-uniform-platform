<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { ProductionItem } from '@/api/production'
import ProductionFilters from '@/components/production/ProductionFilters.vue'
import ProductionTable from '@/components/production/ProductionTable.vue'
import type { ConfigOption, ConfigTableColumn } from '@/components/common/types'
import { useProductionResource } from '@/composables/useProductionResource'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const resource = 'orders' as const
const state = useProductionResource(resource)

const statusOptions: ConfigOption[] = [
  { label: '待排产', value: 'pending' },
  { label: '已排产', value: 'scheduled' },
  { label: '生产中', value: 'producing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const columns = computed<ConfigTableColumn[]>(() => [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 190 },
  ...(auth.hasPermission('production.field.customer')
    ? [{ title: '客户名称', dataIndex: 'customerName', key: 'customerName', width: 180 }]
    : []),
  ...(auth.hasPermission('production.field.product')
    ? [{ title: '生产产品', dataIndex: 'productName', key: 'productName', width: 180 }]
    : []),
  ...(auth.hasPermission('production.field.quantity')
    ? [{ title: '数量', dataIndex: 'quantity', key: 'quantity', width: 110 }]
    : []),
  ...(auth.hasPermission('production.field.date')
    ? [{ title: '交付日期', dataIndex: 'deliveryDate', key: 'deliveryDate', width: 130 }]
    : []),
  ...(auth.hasPermission('production.field.status')
    ? [{ title: '生产状态', dataIndex: 'status', key: 'status', width: 150 }]
    : []),
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right', width: 90 },
])

async function safe(action: () => Promise<void>, fallback: string) {
  try {
    await action()
  } catch (error) {
    message.error(error instanceof Error ? error.message : fallback)
  }
}

function edit(item: ProductionItem) {
  router.push(`/production/orders/${item.id}`)
}

async function changeStatus(payload: { item: ProductionItem; status: string }) {
  await safe(async () => {
    await state.changeStatus(payload.item.id, payload.status)
    message.success('订单状态已更新')
  }, '订单状态更新失败')
}

onMounted(() => safe(state.load, '生产订单加载失败'))
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="page-title">生产订单</h2>
        <p class="mb-0 mt-2 text-secondary">查看生产任务、交付计划与执行状态</p>
      </div>
      <a-button
        v-if="auth.hasPermission('production.order.create')"
        type="primary"
        @click="router.push('/production/orders/new')"
      >
        新建生产订单
      </a-button>
    </div>

    <div class="page-card">
      <ProductionFilters
        :keyword="state.filters.keyword"
        :status="state.filters.status"
        :status-options="statusOptions"
        :loading="state.loading.value"
        @update:keyword="state.filters.keyword = $event"
        @update:status="state.filters.status = $event"
        @search="safe(state.search, '查询失败')"
        @reset="safe(state.reset, '重置失败')"
      />
    </div>

    <div class="page-card overflow-hidden">
      <ProductionTable
        :columns="columns"
        :items="state.items.value"
        :loading="state.loading.value"
        :total="state.total.value"
        :page="state.page.value"
        :page-size="state.pageSize.value"
        :status-options="statusOptions"
        :can-edit="auth.hasPermission('production.order.edit')"
        :can-change-status="auth.hasPermission('production.order.status')"
        @page="safe(() => state.setPage($event), '分页加载失败')"
        @edit="edit"
        @status="changeStatus"
      />
    </div>
  </section>
</template>
