<script setup lang="ts">
import { computed } from 'vue'
import type { QrLabelBatch } from '@/api/qrcodes'
import {
  LABEL_FIELDS,
  LABEL_SIZE_PRESETS,
  type LabelField,
} from './useQrLabelPrint'

const props = defineProps<{
  batches: readonly QrLabelBatch[]
  batchNo: string
  loadingBatches: boolean
  loadingPreview: boolean
}>()
const emit = defineEmits<{
  selectBatch: [value: string]
}>()

const companyName = defineModel<string>('companyName', { required: true })
const selectedSizeKey = defineModel<string>('selectedSizeKey', { required: true })
const customWidth = defineModel<number>('customWidth', { required: true })
const customHeight = defineModel<number>('customHeight', { required: true })
const selectedFields = defineModel<LabelField[]>('selectedFields', { required: true })

const batchOptions = computed(() =>
  props.batches.map((item) => ({
    value: item.batchNo,
    label: `${item.batchNo} · ${item.productName} · ${item.labelCount} 枚`,
  })),
)
const currentBatch = computed(() =>
  props.batches.find((item) => item.batchNo === props.batchNo),
)
</script>

<template>
  <div class="basic-settings">
    <section class="basic-settings__section">
      <header class="basic-settings__heading">
        <h3>标签信息</h3>
        <span>选择打印数据</span>
      </header>
      <div class="basic-settings__form">
        <label for="label-company">公司名称</label>
        <a-input
          id="label-company"
          v-model:value="companyName"
          :maxlength="80"
          allow-clear
          placeholder="请输入公司名称"
        />

        <label for="label-batch">选择批次</label>
        <a-select
          id="label-batch"
          :value="batchNo || undefined"
          :options="batchOptions"
          :loading="loadingBatches || loadingPreview"
          show-search
          option-filter-prop="label"
          placeholder="请选择生产批次"
          @update:value="emit('selectBatch', String($event || ''))"
        />
        <p v-if="currentBatch" class="basic-settings__batch-note">
          {{ currentBatch.productCode }} · 可打印
          {{ currentBatch.labelCount.toLocaleString('zh-CN') }} 枚
        </p>
      </div>
    </section>

    <section class="basic-settings__section">
      <header class="basic-settings__heading">
        <h3>标签尺寸</h3>
        <span>毫米级输出</span>
      </header>
      <div class="basic-settings__sizes">
        <button
          v-for="preset in LABEL_SIZE_PRESETS"
          :key="preset.key"
          type="button"
          :class="{
            'basic-settings__size--active': selectedSizeKey === preset.key,
          }"
          @click="selectedSizeKey = preset.key"
        >
          {{ preset.label }}
        </button>
      </div>
      <div v-if="selectedSizeKey === 'custom'" class="basic-settings__custom-size">
        <a-input-number
          v-model:value="customWidth"
          :min="25"
          :max="500"
          :precision="1"
          addon-after="mm"
          aria-label="自定义标签宽度"
        />
        <span>×</span>
        <a-input-number
          v-model:value="customHeight"
          :min="25"
          :max="500"
          :precision="1"
          addon-after="mm"
          aria-label="自定义标签高度"
        />
      </div>
    </section>

    <section class="basic-settings__section">
      <header class="basic-settings__heading">
        <h3>显示内容</h3>
        <span>{{ selectedFields.length }}/6 项</span>
      </header>
      <a-checkbox-group
        v-model:value="selectedFields"
        class="basic-settings__fields"
      >
        <a-checkbox
          v-for="field in LABEL_FIELDS"
          :key="field.value"
          :value="field.value"
          :disabled="field.value === 'qrcode'"
        >
          {{ field.label }}
        </a-checkbox>
      </a-checkbox-group>
      <p class="basic-settings__standard-note">
        二维码为追溯标签必选项，系统会保留四模块静区。正式批量印刷前仍需使用二维码检测仪验证识读等级。
      </p>
    </section>
  </div>
</template>

<style scoped>
.basic-settings {
  padding: 4px 18px 18px;
}

.basic-settings__section {
  padding: 16px 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.basic-settings__section:last-child {
  padding-bottom: 4px;
  border-bottom: 0;
}

.basic-settings__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.basic-settings__heading h3 {
  margin: 0;
  color: #172033;
  font-size: 13px;
}

.basic-settings__heading span {
  color: #94a3b8;
  font-size: 10px;
}

.basic-settings__form {
  display: flex;
  flex-direction: column;
}

.basic-settings__form label {
  margin-bottom: 6px;
  color: #475569;
  font-size: 11px;
  font-weight: 650;
}

.basic-settings__form label:not(:first-child) {
  margin-top: 13px;
}

.basic-settings__batch-note {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 10px;
}

.basic-settings__sizes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
}

.basic-settings__sizes button {
  min-width: 0;
  padding: 6px 4px;
  border: 1px solid #dce4ee;
  border-radius: 7px;
  color: #475569;
  background: #ffffff;
  font-size: 11px;
  transition: 0.18s ease;
}

.basic-settings__sizes button:hover,
.basic-settings__sizes .basic-settings__size--active {
  border-color: #2f6fed;
  color: #2563eb;
  background: #eff5ff;
  box-shadow: inset 0 0 0 1px #2f6fed;
}

.basic-settings__sizes button:focus-visible {
  outline: 3px solid rgb(59 130 246 / 25%);
  outline-offset: 2px;
}

.basic-settings__custom-size {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  margin-top: 10px;
}

.basic-settings__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 8px;
}

.basic-settings__fields :deep(.ant-checkbox-wrapper) {
  margin-inline-start: 0;
  color: #475569;
  font-size: 12px;
}

.basic-settings__standard-note {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 10px;
  line-height: 1.65;
}
</style>
