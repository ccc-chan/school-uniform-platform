<script setup lang="ts">
import { message } from 'ant-design-vue'
import { uploadFile } from '@/api/common'
import type { ManagedFile } from '@/types/system'

type UploadMode = 'button' | 'card'

const props = withDefaults(defineProps<{
  mode?: UploadMode
  accept?: string
  allowedTypes?: string[]
  maxSizeMb?: number
  disabled?: boolean
}>(), {
  mode: 'button',
  accept: 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
  allowedTypes: () => [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ],
  maxSizeMb: 20,
  disabled: false,
})

const emit = defineEmits<{
  success: [file: ManagedFile]
  error: [error: unknown]
}>()

const uploading = shallowRef(false)

const uploadDisabled = computed(() => props.disabled || uploading.value)

function validate(file: File) {
  if (!props.allowedTypes.includes(file.type)) {
    message.error('仅支持 JPG、PNG、WEBP、GIF 图片或 PDF 文件')
    return false
  }

  if (file.size > props.maxSizeMb * 1024 * 1024) {
    message.error(`单个文件不能超过 ${props.maxSizeMb}MB`)
    return false
  }

  return true
}

async function beforeUpload(file: File) {
  if (!validate(file)) return false

  uploading.value = true
  try {
    const result = await uploadFile(file)
    message.success('文件上传成功')
    emit('success', result)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '文件上传失败')
    emit('error', error)
  } finally {
    uploading.value = false
  }

  return false
}
</script>

<template>
  <a-upload
    :accept="accept"
    :before-upload="beforeUpload"
    :disabled="uploadDisabled"
    :show-upload-list="false"
  >
    <a-button
      v-if="mode === 'button'"
      type="primary"
      :loading="uploading"
    >
      <slot name="button">上传文件</slot>
    </a-button>

    <div
      v-else
      class="upload-card"
      :class="{ 'upload-card-disabled': uploadDisabled }"
    >
      <div class="upload-card-icon">＋</div>
      <div class="upload-card-title">
        {{ uploading ? '上传中...' : '点击上传' }}
      </div>
      <div class="upload-card-description">
        <slot name="description">
          支持图片或 PDF，文件大小不超过 {{ maxSizeMb }}MB
        </slot>
      </div>
    </div>
  </a-upload>
</template>

<style scoped>
.upload-card {
  display: flex;
  width: 180px;
  min-height: 140px;
  padding: 20px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.upload-card:hover {
  border-color: #1677ff;
  background: #f0f7ff;
}

.upload-card-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-card-icon {
  color: #8c8c8c;
  font-size: 32px;
  line-height: 1;
}

.upload-card-title {
  margin-top: 12px;
  color: #262626;
  font-weight: 500;
}

.upload-card-description {
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}
</style>
