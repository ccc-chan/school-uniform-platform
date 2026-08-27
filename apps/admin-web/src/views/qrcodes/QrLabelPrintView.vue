<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef } from 'vue'
import { message } from 'ant-design-vue'
import QrLabelArtwork from './label-print/QrLabelArtwork.vue'
import QrLabelControls from './label-print/QrLabelControls.vue'
import QrLabelPreview from './label-print/QrLabelPreview.vue'
import QrLabelPrintConfirmation from './label-print/QrLabelPrintConfirmation.vue'
import QrLabelTemplateDialogs from './label-print/QrLabelTemplateDialogs.vue'
import type { LabelTemplateSnapshot } from './label-print/QrLabelTemplateDialogs.vue'
import { useQrLabelPrint } from './label-print/useQrLabelPrint'

const {
  batches,
  selectedBatch,
  previewItem,
  previewQrUrl,
  selectedBatchNo,
  companyName,
  selectedSizeKey,
  customWidth,
  customHeight,
  selectedFields,
  labelImageUrl,
  customLayers,
  labelStyle,
  labelLayout,
  dimensions,
  loadingBatches,
  loadingPreview,
  printing,
  printRangeMode,
  printRangeStart,
  printRangeEnd,
  printCopies,
  printCount,
  printItems,
  loadBatches,
  selectBatch,
  print,
} = useQrLabelPrint()

const route = useRoute()
const templateDialogs = useTemplateRef<InstanceType<typeof QrLabelTemplateDialogs>>('templateDialogs')
const currentLabelName = shallowRef('夏季校服标准')

const batchOptions = computed(() =>
  batches.value.map((batch) => ({
    value: batch.batchNo,
    label: `${batch.batchNo} · ${batch.productName} · ${batch.labelCount.toLocaleString('zh-CN')} 枚`,
  })),
)
const templateSnapshot = computed(() => ({
  sizeKey: selectedSizeKey.value,
  width: dimensions.value.width,
  height: dimensions.value.height,
  selectedFields: [...selectedFields.value],
  imageDataUrl: labelImageUrl.value,
  customLayers: JSON.parse(JSON.stringify(customLayers.value)) as typeof customLayers.value,
  style: { ...labelStyle.value },
  layout: JSON.parse(JSON.stringify(labelLayout.value)) as typeof labelLayout.value,
}))

async function run(action: () => Promise<void>, fallback: string) {
  try {
    await action()
  } catch (error) {
    message.error(error instanceof Error ? error.message : fallback)
  }
}

async function handleSelectBatch(batchNo: string) {
  await run(() => selectBatch(batchNo), '标签预览加载失败')
}

async function handlePrint(testOnly = false) {
  await run(() => print(testOnly), testOnly ? '测试页准备失败' : '标签打印准备失败')
}

function applyTemplate(template: LabelTemplateSnapshot) {
  currentLabelName.value = template.name
  selectedSizeKey.value = template.sizeKey
  if (template.sizeKey === 'custom') {
    customWidth.value = template.width
    customHeight.value = template.height
  }
  selectedFields.value = template.selectedFields.includes('qrcode')
    ? [...template.selectedFields]
    : [...template.selectedFields, 'qrcode']
  labelImageUrl.value = template.imageDataUrl
  customLayers.value = JSON.parse(JSON.stringify(template.customLayers)) as typeof customLayers.value
  labelStyle.value = { ...template.style }
  labelLayout.value = JSON.parse(JSON.stringify(template.layout)) as typeof labelLayout.value
}

onMounted(async () => {
  await run(
    () => loadBatches(String(route.query.batchNo || '')),
    '生产批次加载失败',
  )
  if (route.query.action === 'print' && selectedBatch.value) {
    await handlePrint()
  }
})
</script>

<template>
  <section class="label-print-view">
    <header class="label-print-view__page-header">
      <h1>标签打印</h1>
      <p>选择生产批次并核对标签内容</p>
    </header>

    <div class="label-print-view__context">
      <section class="label-print-view__batch-picker">
        <label for="print-batch">选择生产批次</label>
        <a-select
          id="print-batch"
          :value="selectedBatchNo || undefined"
          :options="batchOptions"
          :loading="loadingBatches || loadingPreview"
          show-search
          option-filter-prop="label"
          placeholder="请选择生产批次"
          @update:value="handleSelectBatch(String($event || ''))"
        />
      </section>

      <section class="label-print-view__current-label">
        <p>
          <span>当前标签：</span>
          <strong>{{ currentLabelName }}</strong>
          <i>·</i>
          {{ dimensions.width }} × {{ dimensions.height }} mm
        </p>
        <div class="label-print-view__template-actions">
          <a-button @click="templateDialogs?.openSave()">
            <span aria-hidden="true">▣</span>
            保存为模板
          </a-button>
          <a-button type="primary" ghost @click="templateDialogs?.openCreate()">
            ＋ 新建标签
          </a-button>
        </div>
      </section>
    </div>

    <div class="label-print-view__workspace">
      <QrLabelControls
        v-model:custom-layers="customLayers"
        v-model:label-style="labelStyle"
      />

      <QrLabelPreview
        v-model:label-layout="labelLayout"
        v-model:custom-layers="customLayers"
        v-model:label-style="labelStyle"
        :batch="selectedBatch"
        :item="previewItem"
        :company-name="companyName"
        :selected-fields="selectedFields"
        :dimensions="dimensions"
        :qr-data-url="previewQrUrl"
        :label-image-url="labelImageUrl"
        :loading="loadingPreview"
      />

      <QrLabelPrintConfirmation
        v-model:range-mode="printRangeMode"
        v-model:range-start="printRangeStart"
        v-model:range-end="printRangeEnd"
        v-model:copies="printCopies"
        :batch="selectedBatch"
        :dimensions="dimensions"
        :print-count="printCount"
        :printing="printing"
        @print-test="handlePrint(true)"
        @print="handlePrint(false)"
      />
    </div>

    <QrLabelTemplateDialogs
      ref="templateDialogs"
      :snapshot="templateSnapshot"
      :current-label-name="currentLabelName"
      @apply-template="applyTemplate"
    />

    <div
      v-if="selectedBatch && printItems.length"
      id="qr-label-print-sheet"
      class="qr-label-print-sheet"
      aria-hidden="true"
    >
      <div
        v-for="(item, index) in printItems"
        :key="`${item.id}-${index}`"
        class="qr-label-print-page"
        :style="{ width: `${dimensions.width}mm`, height: `${dimensions.height}mm` }"
      >
        <QrLabelArtwork
          :batch="selectedBatch"
          :item="item"
          :company-name="companyName"
          :selected-fields="selectedFields"
          :dimensions="dimensions"
          :label-style="labelStyle"
          :layout="labelLayout"
          :qr-data-url="item.qrDataUrl"
          :label-image-url="labelImageUrl"
          :custom-layers="customLayers"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.label-print-view {
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  color: #172033;
}

.label-print-view__page-header {
  display: flex;
  min-height: 43px;
  align-items: baseline;
  gap: 12px;
}

.label-print-view__page-header h1 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.label-print-view__page-header p {
  margin: 0;
  color: #718096;
  font-size: 11px;
}

.label-print-view__context {
  display: grid;
  grid-template-columns: minmax(360px, 42%) minmax(0, 1fr);
  gap: 12px;
  margin-top: 2px;
}

.label-print-view__batch-picker,
.label-print-view__current-label {
  min-height: 78px;
  border: 1px solid #e3e8ef;
  border-radius: 3px;
  background: #ffffff;
}

.label-print-view__batch-picker {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 11px 15px;
}

.label-print-view__batch-picker label {
  color: #273142;
  font-size: 11px;
  font-weight: 650;
}

.label-print-view__batch-picker :deep(.ant-select) {
  width: 100%;
}

.label-print-view__batch-picker :deep(.ant-select-selector) {
  border-radius: 3px !important;
  font-size: 11px;
}

.label-print-view__current-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 16px;
}

.label-print-view__current-label p {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #263142;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label-print-view__current-label p span {
  font-weight: 600;
}

.label-print-view__current-label p strong {
  margin-right: 7px;
  color: #111827;
  font-weight: 700;
}

.label-print-view__current-label p i {
  margin-right: 7px;
  color: #94a0b2;
  font-style: normal;
}

.label-print-view__template-actions {
  display: flex;
  flex: none;
  gap: 10px;
}

.label-print-view__template-actions :deep(.ant-btn) {
  display: flex;
  height: 37px;
  align-items: center;
  gap: 6px;
  border-radius: 3px;
  font-size: 11px;
}

.label-print-view__workspace {
  display: grid;
  height: clamp(620px, calc(100vh - 214px), 760px);
  min-height: 620px;
  grid-template-columns: minmax(290px, 0.86fr) minmax(450px, 1.62fr) minmax(305px, 1fr);
  align-items: stretch;
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 1180px) {
  .label-print-view__context {
    grid-template-columns: 1fr;
  }

  .label-print-view__workspace {
    height: auto;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .label-print-view__current-label {
    align-items: flex-start;
    flex-direction: column;
  }

  .label-print-view__template-actions {
    width: 100%;
  }

  .label-print-view__template-actions :deep(.ant-btn) {
    flex: 1;
    justify-content: center;
  }
}
</style>

<style>
.label-template-dialog .ant-modal-content {
  padding: 20px 24px;
  border-radius: 7px;
  box-shadow: 0 20px 55px rgb(15 23 42 / 22%);
}

.label-template-dialog .ant-modal-close {
  top: 17px;
  right: 18px;
}

.label-template-dialog--create .ant-modal-content {
  padding-bottom: 20px;
}

.qr-label-print-sheet {
  position: fixed;
  top: 0;
  left: -100000px;
}

.qr-label-print-page {
  overflow: hidden;
  break-after: page;
  page-break-after: always;
}

.qr-label-print-page:last-child {
  break-after: auto;
  page-break-after: auto;
}

@media print {
  body * {
    visibility: hidden !important;
  }

  #qr-label-print-sheet,
  #qr-label-print-sheet * {
    visibility: visible !important;
  }

  #qr-label-print-sheet {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    display: block !important;
  }

  .qr-label-print-page {
    margin: 0 !important;
  }
}
</style>
