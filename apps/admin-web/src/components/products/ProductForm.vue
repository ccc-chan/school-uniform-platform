<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  productCategoryOptions,
  productQrCodeTypeOptions,
  productSeasonOptions,
  productSizeOptions,
  type ProductInput,
} from '@/api/products'
import type { ConfigFormField } from '@/components/common/types'

const model = defineModel<ProductInput>({ required: true })
defineProps<{ saving: boolean; existingImageId?: number | null }>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
const preview = shallowRef('')
const applicableSchoolsText = shallowRef('')

function parseApplicableSchools(value: string) {
  return value
    .split(/[，,、]/)
    .map((school) => school.trim())
    .filter(Boolean)
}

watch(
  () => model.value.applicableSchools,
  (schools) => {
    applicableSchoolsText.value = schools.join('、')
  },
  { immediate: true },
)

function commitApplicableSchools() {
  model.value = {
    ...model.value,
    applicableSchools: parseApplicableSchools(applicableSchoolsText.value),
  }
}

function handleSubmit() {
  commitApplicableSchools()
  emit('submit')
}

const formModel = computed<Record<string, unknown>>({
  get: () => model.value as unknown as Record<string, unknown>,
  set: (value) => {
    model.value = value as unknown as ProductInput
  },
})

const fields: ConfigFormField[] = [
  { key: 'name', label: '产品名称', type: 'input', required: true },
  { key: 'code', label: '产品编号', type: 'input', required: true },
  {
    key: 'category',
    label: '产品分类',
    type: 'select',
    required: true,
    options: productCategoryOptions,
  },
  {
    key: 'qrCodeType',
    label: '二维码类型',
    type: 'radio',
    required: true,
    options: productQrCodeTypeOptions,
    componentProps: {
      optionType: 'button',
      buttonStyle: 'solid',
    },
  },
  {
    key: 'applicableSchools',
    label: '适用学校',
    type: 'input',
    required: true,
    placeholder: '请输入学校名称，多个学校用逗号或顿号分隔',
  },
  {
    key: 'season',
    label: '季节',
    type: 'select',
    required: true,
    options: productSeasonOptions,
  },
  { key: 'style', label: '款式', type: 'input', required: true },
  {
    key: 'color',
    label: '颜色',
    type: 'input',
    required: true,
    placeholder: '例如：藏青/白',
  },
  {
    key: 'sizes',
    label: '尺码',
    type: 'select',
    required: true,
    options: productSizeOptions,
    placeholder: '请选择尺码',
    componentProps: { mode: 'multiple' },
  },
  {
    key: 'fabricInfo',
    label: '面料信息',
    type: 'textarea',
    componentProps: { rows: 3 },
  },
  { key: 'executionStandard', label: '执行标准', type: 'input' },
  {
    key: 'washingInstructions',
    label: '洗涤说明',
    type: 'textarea',
    span: 2,
    componentProps: { rows: 3 },
  },
  {
    key: 'image',
    label: '产品图片',
    type: 'input',
    required: true,
    span: 2,
  },
]

function beforeUpload(file: File) {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    message.error('仅支持 5MB 以内的 JPG、PNG、WEBP 图片')
    return false
  }
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(file)
  model.value = { ...model.value, image: file }
  return false
}

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <ConfigForm v-model="formModel" :fields="fields" :columns="2">
    <template #field-code="{ update }">
      <a-input
        :value="model.code"
        @update:value="update(String($event).toUpperCase())"
      />
    </template>

    <template #field-applicableSchools>
      <a-input
        :value="applicableSchoolsText"
        placeholder="请输入学校名称，多个学校用逗号或顿号分隔"
        @update:value="applicableSchoolsText = String($event)"
        @blur="commitApplicableSchools"
      />
    </template>

    <template #field-image>
      <div class="flex items-center gap-4">
        <img
          v-if="preview"
          :src="preview"
          alt="产品图片预览"
          class="h-28 w-28 rounded-2 object-cover"
        />
        <ProductImage v-else-if="existingImageId" :file-id="existingImageId" />
        <a-upload
          :before-upload="beforeUpload"
          :show-upload-list="false"
          accept="image/jpeg,image/png,image/webp"
        >
          <a-button>选择图片</a-button>
        </a-upload>
      </div>
    </template>

    <div class="flex justify-end gap-3">
      <a-button @click="emit('cancel')">取消</a-button>
      <a-button type="primary" :loading="saving" @click="handleSubmit">
        保存产品
      </a-button>
    </div>
  </ConfigForm>
</template>
