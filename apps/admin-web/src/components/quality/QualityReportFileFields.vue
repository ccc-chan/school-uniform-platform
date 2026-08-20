<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { ConfigFormField } from '@/components/common/types'

const file = defineModel<File | null>('file', { required: true })
const remarks = defineModel<string>('remarks', { required: true })

const remarksModel = computed<Record<string, unknown>>({
  get: () => ({ remarks: remarks.value }),
  set: value => {
    remarks.value = String(value.remarks ?? '')
  },
})

const fields: ConfigFormField[] = [
  {
    key: 'remarks',
    label: '报告备注',
    type: 'textarea',
    placeholder: '填写报告补充说明（选填）',
    componentProps: {
      rows: 5,
      maxlength: 500,
      showCount: true,
    },
  },
]

function beforeUpload(selectedFile: File) {
  if (selectedFile.type !== 'application/pdf') {
    message.error('仅支持 PDF 检测报告')
    return false
  }
  if (selectedFile.size > 20 * 1024 * 1024) {
    message.error('PDF 文件不能超过 20MB')
    return false
  }
  file.value = selectedFile
  return false
}
</script>

<template>
  <div class="quality-report-file-fields">
    <a-upload
      accept="application/pdf"
      :before-upload="beforeUpload"
      :show-upload-list="false"
    >
      <div class="quality-report-file-fields__upload">
        <div class="text-4xl text-blue-500">PDF</div>
        <div class="mt-3 font-600 text-slate-800">
          {{ file?.name || '点击选择检测报告' }}
        </div>
        <div class="mt-1 text-xs text-slate-400">
          仅支持 PDF，文件不超过 20MB
        </div>
      </div>
    </a-upload>

    <ConfigForm
      v-model="remarksModel"
      class="min-w-0 flex-1"
      :fields="fields"
    />
  </div>
</template>

<style scoped>
.quality-report-file-fields {
  display: flex;
  align-items: stretch;
  gap: 20px;
}

.quality-report-file-fields__upload {
  display: flex;
  width: 250px;
  min-height: 150px;
  padding: 20px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed #93b4ef;
  border-radius: 10px;
  background: #f7faff;
  text-align: center;
}

@media (max-width: 639px) {
  .quality-report-file-fields {
    flex-direction: column;
  }

  .quality-report-file-fields__upload {
    width: 100%;
  }
}
</style>
