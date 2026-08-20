<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createProductionItem,
  getProductionOptions,
  type ProductionInput,
  type ProductionOptions,
} from '@/api/production'
import type { ConfigFormField } from '@/components/common/types'
import ProductionEditor from '@/components/production/ProductionEditor.vue'

const props = defineProps<{
  open: boolean
  productId: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [batchId: number]
}>()

const options = shallowRef<ProductionOptions>({
  products: [],
  employees: [],
  factories: [],
  orders: [],
  batches: [],
  processes: [],
})
const loadingOptions = shallowRef(false)
const saving = shallowRef(false)

const productOrders = computed(() =>
  options.value.orders.filter(
    (item) => item.productId === props.productId,
  ),
)

const fields = computed<ConfigFormField[]>(() => [
  {
    key: 'orderId',
    label: '生产订单',
    type: 'select',
    required: true,
    options: productOrders.value.map((item) => ({
      label: `${item.orderNo} · ${item.productName}`,
      value: item.id,
    })),
  },
  {
    key: 'quantity',
    label: '生产数量',
    type: 'number',
    required: true,
    componentProps: { min: 1, precision: 0 },
  },
  {
    key: 'productionDate',
    label: '生产日期',
    type: 'date',
    required: true,
  },
  {
    key: 'factoryId',
    label: '生产工厂',
    type: 'select',
    required: true,
    options: options.value.factories.map((item) => ({
      label: `${item.code} · ${item.name}`,
      value: item.id,
    })),
  },
  {
    key: 'responsibleEmployeeId',
    label: '负责人',
    type: 'select',
    required: true,
    options: options.value.employees.map((item) => ({
      label: item.name,
      value: item.id,
    })),
  },
  {
    key: 'status',
    label: '批次状态',
    type: 'select',
    required: true,
    options: [
      { label: '待生产', value: 'planned' },
      { label: '生产中', value: 'in_progress' },
      { label: '已暂停', value: 'paused' },
      { label: '已完成', value: 'completed' },
    ],
  },
  {
    key: 'notes',
    label: '批次说明',
    type: 'textarea',
    span: 2,
    componentProps: { rows: 3, maxlength: 500 },
  },
])

function today() {
  const now = new Date()
  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  ).toISOString().slice(0, 10)
}

const defaults = computed<ProductionInput>(() => ({
  orderId: productOrders.value[0]?.id,
  quantity: productOrders.value[0]?.quantity || 1,
  productionDate: today(),
  status: 'planned',
  notes: '',
}))

async function loadOptions() {
  loadingOptions.value = true
  try {
    options.value = await getProductionOptions()
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '生产选项加载失败',
    )
    emit('update:open', false)
  } finally {
    loadingOptions.value = false
  }
}

async function save(value: ProductionInput) {
  saving.value = true
  try {
    const batch = await createProductionItem('batches', value)
    emit('update:open', false)
    emit('created', batch.id)
    message.success('批次创建成功')
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '批次创建失败',
    )
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) void loadOptions()
  },
  { immediate: true },
)
</script>

<template>
  <ProductionEditor
    :open="open"
    title="批次"
    :item="null"
    :fields="fields"
    :defaults="defaults"
    :saving="saving || loadingOptions"
    @update:open="emit('update:open', $event)"
    @submit="save"
  />
</template>
