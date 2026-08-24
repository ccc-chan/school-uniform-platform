<script setup lang="ts">
import { message } from 'ant-design-vue'
import type {
  QualityOptions,
  QualityReportCreate,
  QualityResultInput,
} from '@/api/quality'
import QualityReportBasicFields from './QualityReportBasicFields.vue'
import QualityReportFileFields from './QualityReportFileFields.vue'
import QualityReportResultsEditor from './QualityReportResultsEditor.vue'
import type { QualityReportBasicInput } from './types'

const props = withDefaults(defineProps<{
  options: QualityOptions
  submitting: boolean
  initialProductId?: number
}>(), {
  initialProductId: 0,
})

const emit = defineEmits<{
  submit: [value: QualityReportCreate]
  cancel: []
}>()

const today = new Date().toISOString().slice(0, 10)

const form = reactive<QualityReportBasicInput>({
  name: '',
  productId: props.initialProductId || undefined,
  institution: '',
  inspectionNo: '',
  inspectionDate: today,
  validUntil: today,
})

const basicModel = computed<QualityReportBasicInput>({
  get: () => form,
  set: value => Object.assign(form, value),
})

const reportFile = shallowRef<File | null>(null)
const remarks = shallowRef('')
const resultItems = ref<QualityResultInput[]>([])

function itemDefinition(itemId: number) {
  return props.options.items.find(item => item.id === itemId)
}

function submit() {
  const fields: Array<[string | number | undefined, string]> = [
    [form.name, '报告名称'],
    [form.productId, '关联产品'],
    [form.institution, '检测机构'],
    [form.inspectionNo, '检测编号'],
    [form.inspectionDate, '检测日期'],
    [form.validUntil, '有效期'],
  ]

  const missing = fields.find(([value]) => value === '' || value == null)
  if (missing) {
    message.warning(`请填写${missing[1]}`)
    return
  }

  if (form.validUntil < form.inspectionDate) {
    message.warning('有效期不能早于检测日期')
    return
  }

  if (!reportFile.value) {
    message.warning('请上传 PDF 检测报告')
    return
  }

  if (!resultItems.value.length) {
    message.warning('请至少添加一个检测项目')
    return
  }

  const emptyResult = resultItems.value.find(item => !item.resultValue.trim())
  if (emptyResult) {
    message.warning(
      `请填写${itemDefinition(emptyResult.itemId)?.name || ''}检测结果`,
    )
    return
  }

  emit('submit', {
    ...form,
    productId: Number(form.productId),
    remarks: remarks.value,
    file: reportFile.value,
    resultItems: resultItems.value.map(item => ({ ...item })),
  })
}
</script>

<template>
  <div class="quality-report-form">
    <section class="quality-report-form__section">
      <div class="quality-report-form__section-title">
        <span class="quality-report-form__step">1</span>
        报告基础信息
      </div>
      <QualityReportBasicFields
        v-model="basicModel"
        :products="options.products"
      />
    </section>

    <section class="quality-report-form__section">
      <div class="quality-report-form__section-title">
        <span class="quality-report-form__step">2</span>
        检测项目与结果
      </div>
      <QualityReportResultsEditor
        v-model="resultItems"
        :definitions="options.items"
      />
    </section>

    <section class="quality-report-form__section">
      <div class="quality-report-form__section-title">
        <span class="quality-report-form__step">3</span>
        报告文件与备注
      </div>
      <QualityReportFileFields
        v-model:file="reportFile"
        v-model:remarks="remarks"
      />
    </section>

    <div class="quality-report-form__actions">
      <a-button :disabled="submitting" @click="emit('cancel')">
        取消
      </a-button>
      <a-button type="primary" :loading="submitting" @click="submit">
        提交检测报告
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.quality-report-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-report-form__section {
  padding: 20px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fff;
}

.quality-report-form__section-title {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
  gap: 10px;
  color: #172033;
  font-size: 16px;
  font-weight: 700;
}

.quality-report-form__step {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #2563eb;
  font-size: 13px;
}

.quality-report-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 639px) {
  .quality-report-form__section {
    padding: 16px;
  }
}
</style>
