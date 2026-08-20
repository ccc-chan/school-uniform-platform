<script setup lang="ts">
import type { QualityOptions } from '@/api/quality'
import type { ConfigFormField } from '@/components/common/types'
import type { QualityReportBasicInput } from './types'

const props = defineProps<{
  products: QualityOptions['products']
}>()

const model = defineModel<QualityReportBasicInput>({ required: true })

const formModel = computed<Record<string, unknown>>({
  get: () => model.value as unknown as Record<string, unknown>,
  set: value => {
    model.value = value as unknown as QualityReportBasicInput
  },
})

const productOptions = computed(() =>
  props.products.map(item => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  })),
)

const fields = computed<ConfigFormField[]>(() => [
  {
    key: 'name',
    label: '报告名称',
    type: 'input',
    required: true,
    placeholder: '请输入检测报告名称',
    componentProps: { maxlength: 160 },
  },
  {
    key: 'productId',
    label: '关联产品',
    type: 'select',
    required: true,
    options: productOptions.value,
    placeholder: '选择受检产品',
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
    },
  },
  {
    key: 'institution',
    label: '检测机构',
    type: 'input',
    required: true,
    placeholder: '请输入检测机构全称',
    componentProps: { maxlength: 160 },
  },
  {
    key: 'inspectionNo',
    label: '检测编号',
    type: 'input',
    required: true,
    placeholder: '请输入机构出具的检测编号',
    componentProps: { maxlength: 80 },
  },
  {
    key: 'inspectionDate',
    label: '检测日期',
    type: 'date',
    required: true,
  },
  {
    key: 'validUntil',
    label: '有效期至',
    type: 'date',
    required: true,
  },
])
</script>

<template>
  <ConfigForm v-model="formModel" :fields="fields" :columns="2" />
</template>
