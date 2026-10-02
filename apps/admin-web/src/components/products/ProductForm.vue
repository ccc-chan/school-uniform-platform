<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import SchoolSelect from '@/components/common/SchoolSelect.vue'
import {
  productCategoryOptions,
  productExecutionStandardOptions,
  productQrCodeTypeOptions,
  productSafetyCategoryOptions,
  productSeasonOptions,
  productSizeOptions,
  type ProductInput,
} from '@/api/products'
import type { ConfigFormField } from '@/components/common/types'

const model = defineModel<ProductInput>({ required: true })
defineProps<{ saving: boolean }>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
const previews = shallowRef<string[]>([])
const imageCount = computed(
  () => model.value.retainedImageIds.length + model.value.images.length,
)

function handleSubmit() {
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
    options: productCategoryOptions,
    componentProps: { allowClear: true },
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
    key: 'schoolIds',
    label: '适用学校',
    type: 'input',
    placeholder: '输入学校名称搜索',
  },
  {
    key: 'season',
    label: '季节',
    type: 'select',
    options: productSeasonOptions,
    componentProps: { allowClear: true },
  },
  { key: 'style', label: '款式', type: 'input' },
  {
    key: 'color',
    label: '颜色',
    type: 'input',
    placeholder: '例如：藏青/白',
  },
  {
    key: 'sizes',
    label: '尺码',
    type: 'select',
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
  {
    key: 'executionStandard',
    label: '执行标准',
    type: 'select',
    required: true,
    options: productExecutionStandardOptions,
    placeholder: '请选择执行标准',
  },
  {
    key: 'safetyCategory',
    label: '安全类别',
    type: 'select',
    required: true,
    span: 2,
    options: productSafetyCategoryOptions,
    placeholder: '请选择安全类别',
  },
  {
    key: 'washingInstructions',
    label: '洗涤说明',
    type: 'textarea',
    span: 2,
    componentProps: { rows: 3 },
  },
  {
    key: 'images',
    label: '产品图片',
    type: 'input',
    required: true,
    span: 2,
  },
]

function selectImage(file: File) {
  if (imageCount.value >= 3) {
    message.warning('产品图片最多上传 3 张')
    return
  }
  previews.value = [...previews.value, URL.createObjectURL(file)]
  model.value = { ...model.value, images: [...model.value.images, file] }
}

function removeExistingImage(imageId: number) {
  model.value = {
    ...model.value,
    retainedImageIds: model.value.retainedImageIds.filter(
      (id) => id !== imageId,
    ),
  }
}

function removePendingImage(index: number) {
  const preview = previews.value[index]
  if (preview) URL.revokeObjectURL(preview)
  previews.value = previews.value.filter((_, itemIndex) => itemIndex !== index)
  model.value = {
    ...model.value,
    images: model.value.images.filter((_, itemIndex) => itemIndex !== index),
  }
}

onBeforeUnmount(() => {
  previews.value.forEach((preview) => URL.revokeObjectURL(preview))
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

    <template #field-schoolIds>
      <SchoolSelect v-model="model.schoolIds" multiple />
    </template>

    <template #field-images>
      <div class="flex flex-wrap items-center gap-4">
        <div
          v-for="imageId in model.retainedImageIds"
          :key="`existing-${imageId}`"
          class="flex flex-col gap-2"
        >
          <ProductImage :file-id="imageId" />
          <a-button size="small" danger @click="removeExistingImage(imageId)">
            删除
          </a-button>
        </div>
        <div
          v-for="(preview, index) in previews"
          :key="preview"
          class="flex flex-col gap-2"
        >
          <img
            :src="preview"
            alt="产品图片预览"
            class="h-28 w-28 rounded-2 object-cover"
          />
          <a-button size="small" danger @click="removePendingImage(index)">
            删除
          </a-button>
        </div>
        <FileUpload
          v-if="imageCount < 3"
          mode="custom"
          multiple
          :auto-upload="false"
          accept="image/jpeg,image/png,image/webp"
          :allowed-types="['image/jpeg', 'image/png', 'image/webp']"
          :max-size-mb="5"
          invalid-type-message="仅支持 JPG、PNG、WEBP 图片"
          @select="selectImage"
        >
          <a-button>选择图片（{{ imageCount }}/3）</a-button>
        </FileUpload>
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
