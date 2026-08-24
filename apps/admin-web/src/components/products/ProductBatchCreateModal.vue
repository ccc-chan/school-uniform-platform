<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createProductionItem,
  type ProductionInput,
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

const saving = shallowRef(false)

const fields = computed<ConfigFormField[]>(() => [
  {
    key: 'orderNo',
    label: '生产订单',
    type: 'input',
    required: true,
    placeholder: '请输入生产订单',
    componentProps: { maxlength: 120 },
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
    key: 'factoryName',
    label: '生产工厂',
    type: 'input',
    required: true,
    placeholder: '请输入生产工厂',
    componentProps: { maxlength: 120 },
  },
  {
    key: 'responsibleEmployeeName',
    label: '负责人',
    type: 'input',
    required: true,
    placeholder: '请输入负责人',
    componentProps: { maxlength: 80 },
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
  productId: props.productId,
  orderNo: '',
  factoryName: '',
  responsibleEmployeeName: '',
  quantity: 1,
  productionDate: today(),
  status: 'planned',
  notes: '',
}))

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

</script>

<template>
  <ProductionEditor
    :open="open"
    title="批次"
    :item="null"
    :fields="fields"
    :defaults="defaults"
    :saving="saving"
    @update:open="emit('update:open', $event)"
    @submit="save"
  />
</template>
