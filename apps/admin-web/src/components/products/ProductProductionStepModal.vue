<script setup lang="ts">
import { DatePicker, message } from 'ant-design-vue'
import {
  type ProductProductionStepInput,
  type ProductProductionStepStatus,
} from '@/api/products'
import { getProductionOptions } from '@/api/production'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  batchNo: string
  productName: string
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [value: ProductProductionStepInput]
}>()

const CUSTOM_PROCESS_VALUE = 'custom' as const
type ProcessSelection = number | typeof CUSTOM_PROCESS_VALUE

const processOptions = shallowRef<
  Array<{ label: string; value: ProcessSelection }>
>([])
const optionsLoading = shallowRef(false)
const photo = shallowRef<File | null>(null)

const form = reactive({
  processId: undefined as ProcessSelection | undefined,
  customName: '',
  operatorName: '',
  startedAt: '',
  completedAt: '',
  status: 'completed' as ProductProductionStepStatus,
  notes: '',
})

const statusOptions: Array<{
  label: string
  value: ProductProductionStepStatus
}> = [
  { label: '已完成', value: 'completed' },
  { label: '进行中', value: 'in_progress' },
  { label: '待开始', value: 'pending' },
]

function reset() {
  form.processId = undefined
  form.customName = ''
  form.operatorName = ''
  form.startedAt = ''
  form.completedAt = ''
  form.status = 'completed'
  form.notes = ''
  photo.value = null
}

async function loadOptions() {
  if (processOptions.value.length) return

  optionsLoading.value = true
  try {
    const options = await getProductionOptions()
    processOptions.value = options.processes.map((item) => ({
      label: item.name,
      value: item.id || CUSTOM_PROCESS_VALUE,
    }))
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '生产环节选项加载失败',
    )
  } finally {
    optionsLoading.value = false
  }
}

function beforeUpload(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.error('仅支持 JPG、PNG、WEBP 图片')
    return false
  }

  if (file.size > 10 * 1024 * 1024) {
    message.error('现场照片不能超过 10MB')
    return false
  }

  photo.value = file
  return false
}

function submit() {
  const processId = form.processId
  if (!processId) {
    message.warning('请选择环节名称')
    return
  }
  const custom = processId === CUSTOM_PROCESS_VALUE
  const customName = form.customName.trim()
  if (custom && !customName) {
    message.warning('请输入自定义环节名称')
    return
  }
  if (!form.operatorName.trim()) {
    message.warning('请输入操作人')
    return
  }
  if (!form.startedAt) {
    message.warning('请选择开始日期')
    return
  }
  if (form.completedAt && form.completedAt < form.startedAt) {
    message.warning('完成日期不能早于开始日期')
    return
  }

  emit('submit', {
    processId: custom ? null : processId,
    content: custom ? customName : '',
    operatorName: form.operatorName.trim(),
    startedAt: form.startedAt,
    completedAt: form.completedAt,
    status: form.status,
    notes: form.notes.trim(),
    photo: photo.value,
  })
}

watch(open, (visible) => {
  if (!visible) return
  reset()
  void loadOptions()
})
</script>

<template>
  <a-modal
    v-model:open="open"
    :width="920"
    :footer="null"
    :closable="!props.submitting"
    :mask-closable="!props.submitting"
    wrap-class-name="production-step-modal"
  >
    <template #title>
      <div class="production-step-modal__title">
        <strong>添加生产环节</strong>
        <span>批次 {{ props.batchNo }} · {{ props.productName }}</span>
      </div>
    </template>

    <div class="production-step-modal__scroll">
      <div class="production-step-modal__form">
        <section class="production-step-modal__field">
          <label>环节名称 <i>*</i></label>
          <a-select
            v-model:value="form.processId"
            :options="processOptions"
            :loading="optionsLoading"
            placeholder="选择环节"
          />
        </section>

        <section
          v-if="form.processId === CUSTOM_PROCESS_VALUE"
          class="production-step-modal__field"
        >
          <label>自定义环节名称 <i>*</i></label>
          <a-input
            v-model:value="form.customName"
            :maxlength="200"
            placeholder="请输入环节名称"
          />
        </section>

        <section class="production-step-modal__field">
          <label>操作人 <i>*</i></label>
          <a-input
            v-model:value="form.operatorName"
            :maxlength="80"
            placeholder="如：张师傅"
          />
        </section>

        <div class="production-step-modal__date-grid">
          <section class="production-step-modal__field">
            <label>开始日期 <i>*</i></label>
            <DatePicker
              v-model:value="form.startedAt"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="yyyy/mm/日"
            />
          </section>

          <section class="production-step-modal__field">
            <label>完成日期 <small>（可选）</small></label>
            <DatePicker
              v-model:value="form.completedAt"
              value-format="YYYY-MM-DD"
              format="YYYY/MM/DD"
              placeholder="yyyy/mm/日"
            />
          </section>
        </div>

        <section class="production-step-modal__field">
          <label>环节状态</label>
          <div class="production-step-modal__statuses">
            <label
              v-for="item in statusOptions"
              :key="item.value"
              :class="{ active: form.status === item.value }"
            >
              <input
                v-model="form.status"
                type="radio"
                :value="item.value"
              />
              <span>{{ item.label }}</span>
            </label>
          </div>
        </section>

        <section class="production-step-modal__field">
          <label>备注 <small>（可选）</small></label>
          <a-textarea
            v-model:value="form.notes"
            :maxlength="500"
            :rows="4"
            placeholder="添加备注信息..."
          />
        </section>

        <section class="production-step-modal__field">
          <label>现场照片 <small>（可选）</small></label>
          <a-upload-dragger
            accept=".jpg,.jpeg,.png,.webp"
            :before-upload="beforeUpload"
            :file-list="[]"
            :disabled="props.submitting"
          >
            <div class="production-step-modal__upload-icon">▧</div>
            <strong>{{ photo?.name || '点击上传或拖拽照片' }}</strong>
            <span>支持 JPG、PNG、WEBP，最大 10MB</span>
          </a-upload-dragger>
        </section>
      </div>
    </div>

    <footer class="production-step-modal__footer">
      <a-button :disabled="props.submitting" @click="open = false">
        取消
      </a-button>
      <a-button
        type="primary"
        :loading="props.submitting"
        @click="submit"
      >
        添加环节
      </a-button>
    </footer>
  </a-modal>
</template>

<style scoped>
.production-step-modal__title {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.production-step-modal__title strong {
  color: #172033;
  font-size: 22px;
  line-height: 1.35;
}

.production-step-modal__title span {
  color: #64748b;
  font-size: 14px;
  font-weight: 400;
}

.production-step-modal__scroll {
  max-height: min(68vh, 820px);
  overflow-y: auto;
  margin: 0 -24px;
  padding: 26px 24px 30px;
  border-top: 1px solid #e7edf5;
}

.production-step-modal__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.production-step-modal__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.production-step-modal__field label {
  color: #263247;
  font-size: 14px;
  font-weight: 650;
}

.production-step-modal__field label i {
  color: #ef4444;
  font-style: normal;
}

.production-step-modal__field label small {
  color: #94a3b8;
  font-weight: 400;
}

.production-step-modal__date-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.production-step-modal__field :deep(.ant-select-selector),
.production-step-modal__field :deep(.ant-input),
.production-step-modal__field :deep(.ant-picker) {
  min-height: 52px;
  border-color: #d9e2ee;
  border-radius: 12px;
  box-shadow: none;
}

.production-step-modal__field :deep(.ant-select-selector) {
  align-items: center;
  padding-inline: 16px !important;
}

.production-step-modal__field :deep(.ant-input) {
  padding: 13px 16px;
}

.production-step-modal__field :deep(.ant-picker) {
  width: 100%;
  padding-inline: 16px;
}

.production-step-modal__field :deep(textarea.ant-input) {
  min-height: 124px;
  resize: none;
}

.production-step-modal__statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.production-step-modal__statuses label {
  display: flex;
  min-width: 150px;
  height: 58px;
  padding: 0 22px;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  border: 2px solid #dfe6ef;
  border-radius: 13px;
  background: #fff;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.production-step-modal__statuses label.active {
  border-color: #b9d8ff;
  color: #2563eb;
  background: #f1f7ff;
}

.production-step-modal__statuses input {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.production-step-modal__field :deep(.ant-upload-drag) {
  min-height: 154px;
  border-color: #d8e2ee;
  border-radius: 14px;
  background: #fff;
}

.production-step-modal__field :deep(.ant-upload-btn) {
  padding: 25px !important;
}

.production-step-modal__field :deep(.ant-upload-drag-container) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.production-step-modal__upload-icon {
  color: #b7c6d8;
  font-size: 34px;
  line-height: 1;
}

.production-step-modal__field :deep(.ant-upload-drag strong) {
  color: #334155;
  font-size: 13px;
}

.production-step-modal__field :deep(.ant-upload-drag span) {
  color: #94a3b8;
  font-size: 12px;
}

.production-step-modal__footer {
  display: flex;
  margin: 0 -24px -20px;
  justify-content: flex-end;
  gap: 14px;
  border-top: 1px solid #e7edf5;
  padding: 18px 24px;
  background: #fff;
}

.production-step-modal__footer :deep(.ant-btn) {
  min-width: 116px;
  height: 48px;
  border-radius: 12px;
  font-weight: 650;
}

@media (max-width: 700px) {
  .production-step-modal__date-grid {
    grid-template-columns: 1fr;
  }

  .production-step-modal__statuses {
    display: grid;
    grid-template-columns: 1fr;
  }

  .production-step-modal__statuses label {
    width: 100%;
  }
}
</style>
