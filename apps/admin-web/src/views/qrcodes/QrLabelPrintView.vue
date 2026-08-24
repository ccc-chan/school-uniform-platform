<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import QrLabelArtwork from './label-print/QrLabelArtwork.vue'
import QrLabelControls from './label-print/QrLabelControls.vue'
import QrLabelPreview from './label-print/QrLabelPreview.vue'
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
  labelStyle,
  labelLayout,
  dimensions,
  loadingBatches,
  loadingPreview,
  printing,
  printItems,
  loadBatches,
  selectBatch,
  print,
} = useQrLabelPrint()
const route = useRoute()

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

async function handlePrint() {
  await run(print, '标签打印准备失败')
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
    <PageHeader
      title="标签打印"
      description="选择生产批次并实时校对标签内容，按实际纸张尺寸输出唯一产品身份标签"
    >
      <template #actions>
        <span class="label-print-view__badge">批次标签校样台</span>
      </template>
    </PageHeader>

    <div class="label-print-view__workspace">
      <QrLabelPreview
        :batch="selectedBatch"
        :item="previewItem"
        :company-name="companyName"
        :selected-fields="selectedFields"
        :dimensions="dimensions"
        :label-style="labelStyle"
        :qr-data-url="previewQrUrl"
        :loading="loadingPreview"
        v-model:label-layout="labelLayout"
      />

      <QrLabelControls
        v-model:company-name="companyName"
        v-model:selected-size-key="selectedSizeKey"
        v-model:custom-width="customWidth"
        v-model:custom-height="customHeight"
        v-model:selected-fields="selectedFields"
        v-model:label-style="labelStyle"
        :batches="batches"
        :batch-no="selectedBatchNo"
        :loading-batches="loadingBatches"
        :loading-preview="loadingPreview"
        :printing="printing"
        @select-batch="handleSelectBatch"
        @print="handlePrint"
      />
    </div>

    <div
      v-if="selectedBatch && printItems.length"
      id="qr-label-print-sheet"
      class="qr-label-print-sheet"
      aria-hidden="true"
    >
      <div
        v-for="item in printItems"
        :key="item.id"
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
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.label-print-view {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.label-print-view__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid #dbe7fb;
  border-radius: 9px;
  color: #2563eb;
  background: #f4f8ff;
  font-size: 11px;
  font-weight: 650;
}

.label-print-view__badge::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2f6fed;
  box-shadow: 0 0 0 4px rgb(47 111 237 / 10%);
  content: "";
}

.label-print-view__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
  gap: 20px;
  margin-top: 18px;
}

@media (max-width: 1050px) {
  .label-print-view__workspace {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
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
