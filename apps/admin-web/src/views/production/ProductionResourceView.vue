<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  getProductionOptions,
  type ProductionInput,
  type ProductionItem,
  type ProductionOptions,
  type ProductionResource,
} from '@/api/production'
import type { ConfigFormField, ConfigOption, ConfigTableColumn } from '@/components/common/types'
import ProductionEditor from '@/components/production/ProductionEditor.vue'
import ProductionFilters from '@/components/production/ProductionFilters.vue'
import ProductionTable from '@/components/production/ProductionTable.vue'
import { useProductionResource } from '@/composables/useProductionResource'
import { useAuthStore } from '@/stores/auth'

type ManagedResource = Exclude<ProductionResource, 'orders'>

const route = useRoute()
const auth = useAuthStore()
const resource = computed(
  () => String(route.meta.productionResource || 'batches') as ManagedResource,
)
const state = useProductionResource(resource)
const options = shallowRef<ProductionOptions>({
  products: [], employees: [], factories: [], orders: [], batches: [], processes: [],
})
const editorOpen = shallowRef(false)
const current = shallowRef<ProductionItem | null>(null)
const saving = shallowRef(false)

const labels: Record<ManagedResource, { title: string; description: string; singular: string }> = {
  batches: { title: '生产批次管理', description: '编排订单批次、生产工厂及负责人', singular: '生产批次' },
  processes: { title: '生产流程管理', description: '配置生产流程节点和消费者展示范围', singular: '流程节点' },
  records: { title: '生产记录', description: '记录员工、工序和生产完成情况', singular: '生产记录' },
  factories: { title: '工厂管理', description: '维护工厂资料、产能与启用状态', singular: '工厂' },
  outbounds: { title: '出厂管理', description: '记录批次出厂、收货单位和物流状态', singular: '出厂记录' },
}

const statusOptionsMap: Record<ManagedResource, ConfigOption[]> = {
  batches: [
    { label: '待生产', value: 'planned' }, { label: '生产中', value: 'in_progress' },
    { label: '已暂停', value: 'paused' }, { label: '已完成', value: 'completed' },
  ],
  processes: [{ label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }],
  records: [
    { label: '待开始', value: 'pending' }, { label: '进行中', value: 'in_progress' },
    { label: '已完成', value: 'completed' }, { label: '异常', value: 'exception' },
  ],
  factories: [{ label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }],
  outbounds: [
    { label: '待出厂', value: 'pending' }, { label: '已发运', value: 'shipped' },
    { label: '已签收', value: 'received' }, { label: '已取消', value: 'cancelled' },
  ],
}

const permissionMap: Record<ManagedResource, string> = {
  batches: 'production.batch.manage',
  processes: 'production.process.manage',
  records: 'production.record.manage',
  factories: 'production.factory.manage',
  outbounds: 'production.outbound.manage',
}

const statusOptions = computed(() => statusOptionsMap[resource.value])
const canManage = computed(() => auth.hasPermission(permissionMap[resource.value]))
const canChangeStatus = computed(
  () => canManage.value && ['batches', 'processes', 'factories'].includes(resource.value),
)

const columns = computed<ConfigTableColumn[]>(() => {
  const shared = { title: '状态', dataIndex: 'status', key: 'status', width: 130 }
  const actions = { title: '操作', key: 'actions', fixed: 'right' as const, width: 90 }
  const map: Record<ManagedResource, ConfigTableColumn[]> = {
    batches: [
      { title: '批次编号', dataIndex: 'batchNo', key: 'batchNo', width: 185 },
      { title: '生产订单', dataIndex: 'orderNo', key: 'orderNo', width: 185 },
      { title: '生产产品', dataIndex: 'productName', key: 'productName', width: 170 },
      { title: '生产数量', dataIndex: 'quantity', key: 'quantity', width: 110 },
      { title: '生产日期', dataIndex: 'productionDate', key: 'productionDate', width: 130 },
      { title: '生产工厂', dataIndex: 'factoryName', key: 'factoryName', width: 160 },
      { title: '负责人', dataIndex: 'responsibleEmployeeName', key: 'responsibleEmployeeName', width: 120 },
      shared, actions,
    ],
    processes: [
      { title: '流程名称', dataIndex: 'flowName', key: 'flowName', width: 180 },
      { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName', width: 170 },
      { title: '节点排序', dataIndex: 'nodeOrder', key: 'nodeOrder', width: 100 },
      { title: '节点说明', dataIndex: 'description', key: 'description', width: 280 },
      { title: '消费者展示', dataIndex: 'consumerVisible', key: 'consumerVisible', width: 130 },
      shared, actions,
    ],
    records: [
      { title: '生产批次', dataIndex: 'batchNo', key: 'batchNo', width: 185 },
      { title: '员工', dataIndex: 'employeeName', key: 'employeeName', width: 120 },
      { title: '工序', dataIndex: 'processName', key: 'processName', width: 210 },
      { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
      { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', width: 180 },
      { title: '完成时间', dataIndex: 'completedAt', key: 'completedAt', width: 180 },
      shared, actions,
    ],
    factories: [
      { title: '工厂编号', dataIndex: 'code', key: 'code', width: 150 },
      { title: '工厂名称', dataIndex: 'name', key: 'name', width: 180 },
      { title: '联系人', dataIndex: 'contactName', key: 'contactName', width: 120 },
      { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 150 },
      { title: '工厂地址', dataIndex: 'address', key: 'address', width: 280 },
      { title: '日产能', dataIndex: 'dailyCapacity', key: 'dailyCapacity', width: 110 },
      shared, actions,
    ],
    outbounds: [
      { title: '出厂单号', dataIndex: 'outboundNo', key: 'outboundNo', width: 190 },
      { title: '生产批次', dataIndex: 'batchNo', key: 'batchNo', width: 180 },
      { title: '出厂数量', dataIndex: 'quantity', key: 'quantity', width: 110 },
      { title: '出厂日期', dataIndex: 'outboundDate', key: 'outboundDate', width: 130 },
      { title: '收货单位', dataIndex: 'recipient', key: 'recipient', width: 180 },
      { title: '目的地', dataIndex: 'destination', key: 'destination', width: 220 },
      { title: '经办人', dataIndex: 'handlerName', key: 'handlerName', width: 120 },
      shared, actions,
    ],
  }
  return map[resource.value]
})

const fields = computed<ConfigFormField[]>(() => {
  const statuses = statusOptions.value
  const map: Record<ManagedResource, ConfigFormField[]> = {
    batches: [
      { key: 'orderId', label: '生产订单', type: 'select', required: true, options: options.value.orders.map((item) => ({ label: `${item.orderNo} · ${item.productName}`, value: item.id })) },
      { key: 'quantity', label: '生产数量', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
      { key: 'productionDate', label: '生产日期', type: 'date', required: true },
      { key: 'factoryId', label: '生产工厂', type: 'select', required: true, options: options.value.factories.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id })) },
      { key: 'responsibleEmployeeId', label: '负责人', type: 'select', required: true, options: options.value.employees.map((item) => ({ label: item.name, value: item.id })) },
      { key: 'status', label: '批次状态', type: 'select', required: true, options: statuses },
      { key: 'notes', label: '批次说明', type: 'textarea', span: 2, componentProps: { rows: 3, maxlength: 500 } },
    ],
    processes: [
      { key: 'flowName', label: '流程名称', type: 'input', required: true },
      { key: 'nodeName', label: '节点名称', type: 'input', required: true },
      { key: 'nodeOrder', label: '节点排序', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
      { key: 'consumerVisible', label: '展示给消费者', type: 'switch' },
      { key: 'status', label: '节点状态', type: 'select', required: true, options: statuses },
      { key: 'description', label: '节点说明', type: 'textarea', span: 2, componentProps: { rows: 3, maxlength: 500 } },
    ],
    records: [
      { key: 'batchId', label: '生产批次', type: 'select', required: true, options: options.value.batches.map((item) => ({ label: item.batchNo, value: item.id })) },
      { key: 'employeeId', label: '员工', type: 'select', required: true, options: options.value.employees.map((item) => ({ label: item.name, value: item.id })) },
      { key: 'processId', label: '生产工序', type: 'select', required: true, options: options.value.processes.map((item) => ({ label: item.name, value: item.id })) },
      { key: 'quantity', label: '完成数量', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
      { key: 'startedAt', label: '开始时间', type: 'date', required: true, componentProps: { type: 'datetime-local' } },
      { key: 'completedAt', label: '完成时间', type: 'date', componentProps: { type: 'datetime-local' } },
      { key: 'status', label: '生产状态', type: 'select', required: true, options: statuses },
      { key: 'notes', label: '生产说明', type: 'textarea', span: 2, componentProps: { rows: 3, maxlength: 500 } },
    ],
    factories: [
      { key: 'code', label: '工厂编号', type: 'input', required: true },
      { key: 'name', label: '工厂名称', type: 'input', required: true },
      { key: 'contactName', label: '联系人', type: 'input', required: true },
      { key: 'contactPhone', label: '联系电话', type: 'input', required: true },
      { key: 'dailyCapacity', label: '日产能', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
      { key: 'status', label: '工厂状态', type: 'select', required: true, options: statuses },
      { key: 'address', label: '工厂地址', type: 'textarea', required: true, span: 2, componentProps: { rows: 3, maxlength: 255 } },
    ],
    outbounds: [
      { key: 'batchId', label: '生产批次', type: 'select', required: true, options: options.value.batches.map((item) => ({ label: `${item.batchNo}（${item.quantity}件）`, value: item.id })) },
      { key: 'quantity', label: '出厂数量', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
      { key: 'outboundDate', label: '出厂日期', type: 'date', required: true },
      { key: 'handledBy', label: '经办人', type: 'select', required: true, options: options.value.employees.map((item) => ({ label: item.name, value: item.id })) },
      { key: 'recipient', label: '收货单位', type: 'input', required: true },
      { key: 'status', label: '出厂状态', type: 'select', required: true, options: statuses },
      { key: 'destination', label: '目的地', type: 'textarea', required: true, span: 2, componentProps: { rows: 2, maxlength: 255 } },
      { key: 'notes', label: '出厂备注', type: 'textarea', span: 2, componentProps: { rows: 2, maxlength: 500 } },
    ],
  }
  return map[resource.value]
})

const localIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString()
}
const today = () => localIso().slice(0, 10)
const defaults = computed<ProductionInput>(() => ({
  status: statusOptions.value[0]?.value || '',
  quantity: 1,
  productionDate: today(),
  outboundDate: today(),
  startedAt: localIso().slice(0, 16),
  consumerVisible: true,
  nodeOrder: 1,
  dailyCapacity: 1,
  notes: '',
  description: '',
}))

async function safe(action: () => Promise<void>, fallback: string) {
  try { await action() } catch (error) {
    message.error(error instanceof Error ? error.message : fallback)
  }
}

async function loadOptions() {
  options.value = await getProductionOptions()
}

function openEditor(item: ProductionItem | null = null) {
  current.value = item && resource.value === 'records'
    ? {
        ...item,
        startedAt: item.startedAt?.replace(' ', 'T').slice(0, 16),
        completedAt: item.completedAt === '-' ? '' : item.completedAt?.replace(' ', 'T').slice(0, 16),
      }
    : item
  editorOpen.value = true
}

async function save(value: ProductionInput) {
  saving.value = true
  try {
    await state.save(current.value?.id || null, value)
    await loadOptions()
    editorOpen.value = false
    message.success('保存成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function changeStatus(payload: { item: ProductionItem; status: string }) {
  await safe(async () => {
    await state.changeStatus(payload.item.id, payload.status)
    await loadOptions()
    message.success('状态已更新')
  }, '状态更新失败')
}

watch(resource, async () => {
  editorOpen.value = false
  Object.assign(state.filters, { keyword: '', status: '' })
  await safe(async () => Promise.all([state.load(), loadOptions()]).then(() => undefined), '生产数据加载失败')
}, { immediate: true })
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="page-title">{{ labels[resource].title }}</h2>
        <p class="mb-0 mt-2 text-secondary">{{ labels[resource].description }}</p>
      </div>
      <a-button v-if="canManage" type="primary" @click="openEditor()">
        新增{{ labels[resource].singular }}
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
        :can-edit="canManage"
        :can-change-status="canChangeStatus"
        @page="safe(() => state.setPage($event), '分页加载失败')"
        @edit="openEditor"
        @status="changeStatus"
      />
    </div>

    <ProductionEditor
      v-model:open="editorOpen"
      :title="labels[resource].singular"
      :item="current"
      :fields="fields"
      :defaults="defaults"
      :saving="saving"
      @submit="save"
    />
  </section>
</template>
