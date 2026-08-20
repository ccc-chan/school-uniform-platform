<script setup lang="ts">
import type { ProductionInput, ProductionOptions } from '@/api/production'
import type { ConfigFormField } from '@/components/common/types'

const props = defineProps<{
  modelValue: ProductionInput
  options: ProductionOptions
  loading: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: ProductionInput]
  submit: []
  cancel: []
}>()

const model = computed<Record<string, unknown>>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const fields = computed<ConfigFormField[]>(() => [
  { key: 'customerName', label: '客户名称', type: 'input', required: true, placeholder: '请输入学校或客户名称' },
  {
    key: 'productId',
    label: '生产产品',
    type: 'select',
    required: true,
    options: props.options.products.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id })),
  },
  { key: 'quantity', label: '订单数量', type: 'number', required: true, componentProps: { min: 1, precision: 0 } },
  { key: 'deliveryDate', label: '交付日期', type: 'date', required: true },
  {
    key: 'status',
    label: '生产状态',
    type: 'select',
    required: true,
    options: [
      { label: '待排产', value: 'pending' },
      { label: '已排产', value: 'scheduled' },
      { label: '生产中', value: 'producing' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' },
    ],
  },
  { key: 'notes', label: '订单备注', type: 'textarea', span: 2, componentProps: { rows: 4, maxlength: 500, showCount: true } },
])
</script>

<template>
  <div class="page-card">
    <ConfigForm v-model="model" :fields="fields" :columns="2" />
    <div class="mt-3 flex justify-end gap-3 border-t border-slate-100 pt-5">
      <a-button @click="emit('cancel')">返回列表</a-button>
      <a-button type="primary" :loading="loading" @click="emit('submit')">
        保存订单
      </a-button>
    </div>
  </div>
</template>
