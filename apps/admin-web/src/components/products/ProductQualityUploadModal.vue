<script setup lang="ts">
import { message } from 'ant-design-vue'
import type {
  QuickQualityReportCreate,
  QuickQualityReportType,
} from '@/api/quality'

const props = defineProps<{
  productId: number
  productName: string
  batchNo: string
  submitting: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  submit: [value: QuickQualityReportCreate]
}>()

const reportTypes: Array<{
  value: QuickQualityReportType
  label: string
}> = [
  { value: 'certificate', label: '合格证书' },
  { value: 'fabric', label: '布料检测' },
  { value: 'quality', label: '质检报告' },
]

const form = reactive({
  reportType: 'certificate' as QuickQualityReportType,
  conclusion: 'qualified' as 'qualified' | 'unqualified',
  remarks: '',
})
const reportFile = shallowRef<File | null>(null)

function reset() {
  form.reportType = 'certificate'
  form.conclusion = 'qualified'
  form.remarks = ''
  reportFile.value = null
}

function beforeUpload(file: File) {
  const extensionAllowed = /\.(pdf|jpe?g|png)$/i.test(file.name)
  const typeAllowed = ['application/pdf', 'image/jpeg', 'image/png'].includes(
    file.type,
  )

  if (!extensionAllowed || (file.type && !typeAllowed)) {
    message.error('仅支持 PDF、JPG、PNG 文件')
    return false
  }
  if (file.size > 20 * 1024 * 1024) {
    message.error('上传文件不能超过 20MB')
    return false
  }

  reportFile.value = file
  return false
}

function submit() {
  if (!reportFile.value) {
    message.warning('请上传质检文件')
    return
  }

  emit('submit', {
    productId: props.productId,
    batchNo: props.batchNo,
    reportType: form.reportType,
    conclusion: form.conclusion,
    remarks: form.remarks.trim(),
    file: reportFile.value,
  })
}

watch(open, (visible) => {
  if (visible) reset()
})
</script>

<template>
  <a-modal
    v-model:open="open"
    :width="560"
    :footer="null"
    :mask-closable="false"
    wrap-class-name="quality-upload-modal"
  >
    <template #title>
      <div class="quality-upload-modal__title">
        <strong>上传质检报告</strong>
        <span>批次 {{ batchNo }} · {{ productName }}</span>
      </div>
    </template>

    <div class="quality-upload-modal__body">
      <section class="quality-upload-modal__section">
        <label class="quality-upload-modal__label"> 报告类型 <i>*</i> </label>
        <div class="quality-upload-modal__types">
          <button
            v-for="item in reportTypes"
            :key="item.value"
            type="button"
            :class="{ active: form.reportType === item.value }"
            @click="form.reportType = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </section>

      <section class="quality-upload-modal__section">
        <label class="quality-upload-modal__label"> 上传文件 <i>*</i> </label>
        <a-upload-dragger
          accept=".pdf,.jpg,.jpeg,.png"
          :before-upload="beforeUpload"
          :file-list="[]"
          :disabled="submitting"
        >
          <div class="quality-upload-modal__upload-icon">↥</div>
          <strong>
            {{ reportFile?.name || '点击上传或拖拽文件' }}
          </strong>
          <span>支持 PDF、JPG、PNG，最大 20MB</span>
        </a-upload-dragger>
      </section>

      <section class="quality-upload-modal__section">
        <label class="quality-upload-modal__label"> 检测结果 <i>*</i> </label>
        <a-radio-group v-model:value="form.conclusion">
          <a-radio-button value="qualified">合格</a-radio-button>
          <a-radio-button value="unqualified">不合格</a-radio-button>
        </a-radio-group>
      </section>

      <section class="quality-upload-modal__section">
        <label class="quality-upload-modal__label">
          备注 <small>（可选）</small>
        </label>
        <a-textarea
          v-model:value="form.remarks"
          :maxlength="500"
          :rows="3"
          placeholder="添加备注信息..."
        />
      </section>
    </div>

    <footer class="quality-upload-modal__footer">
      <a-button :disabled="submitting" @click="open = false"> 取消 </a-button>
      <a-button type="primary" :loading="submitting" @click="submit">
        提交
      </a-button>
    </footer>
  </a-modal>
</template>

<style scoped>
.quality-upload-modal__title {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.quality-upload-modal__title strong {
  color: #172033;
  font-size: 17px;
}
.quality-upload-modal__title span {
  color: #64748b;
  font-size: 11px;
  font-weight: 400;
}
.quality-upload-modal__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0 22px;
}
.quality-upload-modal__section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.quality-upload-modal__label {
  color: #263247;
  font-size: 12px;
  font-weight: 650;
}
.quality-upload-modal__label i {
  color: #ef4444;
  font-style: normal;
}
.quality-upload-modal__label small {
  color: #94a3b8;
  font-weight: 400;
}
.quality-upload-modal__types {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.quality-upload-modal__types button {
  height: 46px;
  border: 1px solid #d9e2ee;
  border-radius: 12px;
  color: #334155;
  background: #fff;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition:
    border-color 0.16s,
    box-shadow 0.16s,
    background 0.16s;
}
.quality-upload-modal__types button:hover {
  border-color: #8bb2ff;
}
.quality-upload-modal__types button.active {
  border-color: #2563eb;
  background: #f5f8ff;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 14%);
}
.quality-upload-modal__upload-icon {
  display: flex;
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #8ca0bb;
  background: #f0f4f9;
  font-size: 30px;
  font-weight: 400;
}
.quality-upload-modal__section :deep(.ant-upload-drag) {
  min-height: 174px;
  border-color: #d6e1ef;
  border-radius: 12px;
  background: #fff;
}
.quality-upload-modal__section :deep(.ant-upload-btn) {
  padding: 28px 18px !important;
}
.quality-upload-modal__section :deep(.ant-upload-drag strong) {
  display: block;
  overflow: hidden;
  color: #44536a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quality-upload-modal__section :deep(.ant-upload-drag span) {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}
.quality-upload-modal__section :deep(.ant-radio-button-wrapper) {
  height: 46px;
  border: 1px solid #d9e2ee;
  border-radius: 10px;
  padding-inline: 18px;
  color: #475569;
  line-height: 44px;
}
.quality-upload-modal__section :deep(.ant-radio-button-wrapper::before) {
  display: none;
}
.quality-upload-modal__section
  :deep(.ant-radio-button-wrapper + .ant-radio-button-wrapper) {
  margin-left: 12px;
}
.quality-upload-modal__section :deep(.ant-radio-button-wrapper-checked) {
  border-color: #b8e7c7;
  color: #16803c;
  background: #effaf2;
  box-shadow: none;
}
.quality-upload-modal__section :deep(.ant-input) {
  border-radius: 10px;
  padding: 11px 13px;
  resize: none;
}
.quality-upload-modal__footer {
  display: flex;
  margin: 0 -24px -10px;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e7edf5;
  padding: 16px 24px 0;
}
.quality-upload-modal__footer :deep(.ant-btn) {
  height: 40px;
  border-radius: 10px;
  padding-inline: 20px;
}
@media (max-width: 560px) {
  .quality-upload-modal__types {
    grid-template-columns: 1fr;
  }
}
</style>
