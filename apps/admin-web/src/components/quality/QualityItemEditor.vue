<script setup lang="ts">
import { message } from 'ant-design-vue'
import type {
  QualityInspectionItem,
  QualityInspectionItemInput,
} from '@/api/quality'
import type { ConfigFormField } from '@/components/common/types'

const props = defineProps<{
  open: boolean
  item: QualityInspectionItem | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: QualityInspectionItemInput]
}>()

const form = reactive<QualityInspectionItemInput>({
  code: '',
  name: '',
  category: '',
  standardRequirement: '',
  unit: '',
  status: 'enabled',
})

const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: value => Object.assign(form, value),
})

const fields = computed<ConfigFormField[]>(() => [
  {
    key: 'code',
    label: '项目编号',
    type: 'input',
    required: true,
    disabled: Boolean(props.item),
    placeholder: '例如：Q-FIBER-001',
    componentProps: { maxlength: 40 },
  },
  {
    key: 'name',
    label: '项目名称',
    type: 'input',
    required: true,
    placeholder: '例如：纤维含量',
    componentProps: { maxlength: 120 },
  },
  {
    key: 'category',
    label: '项目分类',
    type: 'input',
    required: true,
    placeholder: '例如：面料安全',
    componentProps: { maxlength: 80 },
  },
  {
    key: 'unit',
    label: '结果单位',
    type: 'input',
    placeholder: '例如：%、mg/kg',
    componentProps: { maxlength: 30 },
  },
  {
    key: 'standardRequirement',
    label: '标准要求',
    type: 'textarea',
    required: true,
    span: 2,
    placeholder: '填写执行标准或合格要求',
    componentProps: { rows: 3, maxlength: 500, showCount: true },
  },
  {
    key: 'status',
    label: '状态',
    type: 'radio',
    span: 2,
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
])

watch(
  () => [props.open, props.item] as const,
  () => {
    if (!props.open) return
    Object.assign(form, {
      code: props.item?.code || '',
      name: props.item?.name || '',
      category: props.item?.category || '',
      standardRequirement: props.item?.standardRequirement || '',
      unit: props.item?.unit || '',
      status: props.item?.status || 'enabled',
    })
  },
  { immediate: true },
)

function submit() {
  const requiredFields: Array<[keyof QualityInspectionItemInput, string]> = [
    ['code', '项目编号'],
    ['name', '项目名称'],
    ['category', '项目分类'],
    ['standardRequirement', '标准要求'],
  ]
  const missing = requiredFields.find(([key]) => !String(form[key] || '').trim())
  if (missing) {
    message.warning(`请填写${missing[1]}`)
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <a-modal
    :open="open"
    :title="item ? '编辑检测项目' : '新增检测项目'"
    :confirm-loading="saving"
    :width="680"
    wrap-class-name="responsive-modal"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" :columns="2" />
  </a-modal>
</template>
