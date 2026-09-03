<script setup lang="ts">
import { computed } from 'vue'
import type { QrLabelBatch } from '@/api/qrcodes'
import type { LabelDimensions, PrintRangeMode } from './useQrLabelPrint'

const props = defineProps<{
  batch: QrLabelBatch | null
  dimensions: LabelDimensions
  printCount: number
  printing: boolean
}>()
const emit = defineEmits<{
  resize: [dimensions: LabelDimensions]
  print: []
  printTest: []
}>()

const rangeMode = defineModel<PrintRangeMode>('rangeMode', { required: true })
const rangeStart = defineModel<number>('rangeStart', { required: true })
const rangeEnd = defineModel<number>('rangeEnd', { required: true })
const copies = defineModel<number>('copies', { required: true })

const total = computed(() => props.batch?.labelCount ?? 0)
const printable = computed(() => Boolean(props.batch) && props.printCount > 0)

function setRangeMode(value: unknown) {
  rangeMode.value = String(value) as PrintRangeMode
}

function changeCopies(change: number) {
  copies.value = Math.min(99, Math.max(1, copies.value + change))
}

function updateDimension(
  key: keyof LabelDimensions,
  value: unknown,
) {
  const dimension = Number(value)
  if (!Number.isFinite(dimension) || dimension <= 0) return

  emit('resize', {
    ...props.dimensions,
    [key]: Number(dimension.toFixed(1)),
  })
}
</script>

<template>
  <aside class="print-confirmation">
    <header class="print-confirmation__header">
      <h2>打印确认</h2>
    </header>

    <div class="print-confirmation__body">
      <dl class="print-confirmation__summary">
        <div>
          <dt>标签数量</dt>
          <dd class="print-confirmation__count">{{ total.toLocaleString('zh-CN') }} 枚</dd>
        </div>
        <div class="print-confirmation__size-row">
          <dt class="print-confirmation__size-heading">
            <span>标签尺寸</span>
            <small>实时同步画布</small>
          </dt>
          <dd class="print-confirmation__size-editor">
            <label>
              <span>宽</span>
              <a-input-number
                :value="dimensions.width"
                :min="1"
                :step="1"
                :precision="1"
                addon-after="mm"
                aria-label="标签宽度"
                @update:value="updateDimension('width', $event)"
              />
            </label>
            <b aria-hidden="true">×</b>
            <label>
              <span>高</span>
              <a-input-number
                :value="dimensions.height"
                :min="1"
                :step="1"
                :precision="1"
                addon-after="mm"
                aria-label="标签高度"
                @update:value="updateDimension('height', $event)"
              />
            </label>
          </dd>
        </div>
        <div>
          <dt>打印范围</dt>
          <dd>{{ rangeMode === 'all' ? '全部标签' : '指定范围' }}</dd>
        </div>
        <div>
          <dt>打印份数</dt>
          <dd>{{ copies }}</dd>
        </div>
      </dl>

      <section class="print-confirmation__section">
        <h3>打印范围</h3>
        <a-radio-group :value="rangeMode" @update:value="setRangeMode">
          <a-radio value="all">
            全部标签（共 {{ total.toLocaleString('zh-CN') }} 枚）
          </a-radio>
          <div class="print-confirmation__custom-range">
            <a-radio value="custom">指定范围</a-radio>
            <a-input-number
              v-model:value="rangeStart"
              :min="1"
              :max="Math.max(1, total)"
              :disabled="rangeMode !== 'custom'"
              aria-label="起始标签序号"
            />
            <span>–</span>
            <a-input-number
              v-model:value="rangeEnd"
              :min="1"
              :max="Math.max(1, total)"
              :disabled="rangeMode !== 'custom'"
              aria-label="结束标签序号"
            />
            <span>枚</span>
          </div>
        </a-radio-group>
      </section>

      <section class="print-confirmation__section">
        <h3>打印份数</h3>
        <div class="print-confirmation__stepper">
          <button type="button" :disabled="copies <= 1" @click="changeCopies(-1)">−</button>
          <span>{{ copies }}</span>
          <button type="button" :disabled="copies >= 99" @click="changeCopies(1)">＋</button>
          <small>份</small>
        </div>
      </section>

      <p class="print-confirmation__notice">
        <span aria-hidden="true">ⓘ</span>
        打印窗口请选择 {{ dimensions.width }} × {{ dimensions.height }} mm
        纸张、边距“无”、缩放 100%。若没有该纸张，请先在打印机驱动中添加自定义纸张。
      </p>

      <div class="print-confirmation__actions">
        <a-button
          size="large"
          block
          :disabled="!printable || printing"
          @click="emit('printTest')"
        >
          打印测试页
        </a-button>
        <a-button
          type="primary"
          size="large"
          block
          :loading="printing"
          :disabled="!printable"
          @click="emit('print')"
        >
          <span aria-hidden="true">▣</span>
          打印 {{ printCount.toLocaleString('zh-CN') }} 枚标签
        </a-button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.print-confirmation {
  display: grid;
  min-width: 0;
  height: 100%;
  grid-template-rows: 49px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: 3px;
  background: #ffffff;
}

.print-confirmation__header {
  display: flex;
  align-items: center;
  padding: 0 17px;
  border-bottom: 1px solid #e5eaf1;
}

.print-confirmation__header h2,
.print-confirmation__section h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 650;
}

.print-confirmation__body {
  display: flex;
  min-height: 0;
  overflow-y: auto;
  flex-direction: column;
  padding: 17px;
  scrollbar-width: thin;
}

.print-confirmation__summary {
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #e7ebf1;
}

.print-confirmation__summary > div {
  display: flex;
  min-height: 45px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.print-confirmation__summary dt {
  color: #303a49;
  font-size: 11px;
  font-weight: 600;
}

.print-confirmation__summary dd {
  margin: 0;
  color: #111827;
  font-size: 11px;
  text-align: right;
}

.print-confirmation__summary .print-confirmation__count {
  color: #1677ff;
  font-size: 14px;
  font-weight: 700;
}

.print-confirmation__summary > .print-confirmation__size-row {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  justify-content: stretch;
  gap: 9px;
  margin: 2px 0 6px;
  padding: 11px;
  border: 1px solid #e5eaf1;
  border-radius: 4px;
  background: #f8fafc;
}

.print-confirmation__size-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  white-space: nowrap;
}

.print-confirmation__size-heading small {
  color: #8a96a8;
  font-size: 9px;
  font-weight: 400;
}

.print-confirmation__size-editor {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 8px;
}

.print-confirmation__size-editor label {
  display: grid;
  min-width: 0;
  gap: 4px;
  color: #7a8698;
  font-size: 9px;
  text-align: left;
}

.print-confirmation__size-editor b {
  padding-bottom: 8px;
  color: #7a8698;
  font-weight: 500;
}

.print-confirmation__size-editor :deep(.ant-input-number-group-wrapper),
.print-confirmation__size-editor :deep(.ant-input-number) {
  width: 100%;
  min-width: 0;
}

.print-confirmation__size-editor :deep(.ant-input-number) {
  background: #ffffff;
}

.print-confirmation__size-editor :deep(.ant-input-number),
.print-confirmation__size-editor :deep(.ant-input-number-group-addon) {
  border-radius: 3px;
  font-size: 10px;
}

.print-confirmation__size-editor :deep(.ant-input-number-group-addon) {
  padding-inline: 8px;
  color: #64748b;
  background: #f1f5f9;
}

.print-confirmation__section {
  padding: 17px 0 18px;
  border-bottom: 1px solid #e7ebf1;
}

.print-confirmation__section h3 {
  margin-bottom: 14px;
  font-size: 12px;
}

.print-confirmation__section :deep(.ant-radio-group) {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 13px;
}

.print-confirmation__section :deep(.ant-radio-wrapper) {
  color: #2d3746;
  font-size: 11px;
}

.print-confirmation__custom-range {
  display: grid;
  grid-template-columns: auto minmax(54px, 1fr) auto minmax(54px, 1fr) auto;
  align-items: center;
  gap: 7px;
  color: #4f5b6d;
  font-size: 10px;
}

.print-confirmation__custom-range :deep(.ant-input-number) {
  width: 100%;
  border-radius: 3px;
}

.print-confirmation__stepper {
  display: grid;
  width: 155px;
  grid-template-columns: 33px 58px 33px auto;
  align-items: center;
}

.print-confirmation__stepper button,
.print-confirmation__stepper span {
  display: flex;
  height: 31px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dde4ed;
  background: #ffffff;
}

.print-confirmation__stepper button:first-child {
  border-radius: 3px 0 0 3px;
}

.print-confirmation__stepper button:nth-child(3) {
  border-radius: 0 3px 3px 0;
}

.print-confirmation__stepper span {
  border-width: 1px 0;
  color: #152033;
  font-size: 11px;
}

.print-confirmation__stepper small {
  margin-left: 10px;
  color: #606c7e;
  font-size: 10px;
}

.print-confirmation__notice {
  display: flex;
  gap: 8px;
  margin: 17px 0 0;
  padding: 10px;
  border: 1px solid #d6e7ff;
  border-radius: 3px;
  color: #596a80;
  background: #f4f8ff;
  font-size: 9px;
  line-height: 1.6;
}

.print-confirmation__notice span {
  flex: none;
  color: #1677ff;
}

.print-confirmation__actions {
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding-top: 28px;
}

.print-confirmation__actions :deep(.ant-btn) {
  height: 43px;
  border-radius: 3px;
  font-size: 12px;
}

.print-confirmation__actions :deep(.ant-btn-primary) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  box-shadow: none;
}

.print-confirmation button:focus-visible {
  outline: 2px solid rgb(22 119 255 / 35%);
  outline-offset: 1px;
}

@media (max-width: 1180px) {
  .print-confirmation {
    height: auto;
  }

  .print-confirmation__body {
    overflow: visible;
  }
}
</style>
