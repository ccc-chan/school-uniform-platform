<script setup lang="ts">
import { shallowRef } from 'vue'
import type { QrLabelBatch } from '@/api/qrcodes'
import QrLabelBasicSettings from './QrLabelBasicSettings.vue'
import QrLabelStyleSettings from './QrLabelStyleSettings.vue'
import type { LabelField, LabelStyleConfig } from './useQrLabelPrint'

type SettingsPanel = 'basic' | 'style'

const props = defineProps<{
  batches: readonly QrLabelBatch[]
  batchNo: string
  loadingBatches: boolean
  loadingPreview: boolean
  printing: boolean
}>()
const emit = defineEmits<{
  selectBatch: [value: string]
  print: []
}>()

const companyName = defineModel<string>('companyName', { required: true })
const selectedSizeKey = defineModel<string>('selectedSizeKey', { required: true })
const customWidth = defineModel<number>('customWidth', { required: true })
const customHeight = defineModel<number>('customHeight', { required: true })
const selectedFields = defineModel<LabelField[]>('selectedFields', { required: true })
const labelStyle = defineModel<LabelStyleConfig>('labelStyle', { required: true })
const activePanel = shallowRef<SettingsPanel>('basic')
</script>

<template>
  <aside class="label-controls">
    <nav class="label-controls__tabs" role="tablist" aria-label="标签设置分类">
      <button
        id="label-basic-tab"
        type="button"
        role="tab"
        :aria-selected="activePanel === 'basic'"
        aria-controls="label-basic-panel"
        :class="{ 'label-controls__tab--active': activePanel === 'basic' }"
        @click="activePanel = 'basic'"
      >
        <span aria-hidden="true">◆</span>
        基础设置
      </button>
      <button
        id="label-style-tab"
        type="button"
        role="tab"
        :aria-selected="activePanel === 'style'"
        aria-controls="label-style-panel"
        :class="{ 'label-controls__tab--active': activePanel === 'style' }"
        @click="activePanel = 'style'"
      >
        <span aria-hidden="true">◈</span>
        样式设计
      </button>
    </nav>

    <div class="label-controls__viewport">
      <div
        v-show="activePanel === 'basic'"
        id="label-basic-panel"
        role="tabpanel"
        aria-labelledby="label-basic-tab"
      >
        <QrLabelBasicSettings
          v-model:company-name="companyName"
          v-model:selected-size-key="selectedSizeKey"
          v-model:custom-width="customWidth"
          v-model:custom-height="customHeight"
          v-model:selected-fields="selectedFields"
          :batches="props.batches"
          :batch-no="props.batchNo"
          :loading-batches="props.loadingBatches"
          :loading-preview="props.loadingPreview"
          @select-batch="emit('selectBatch', $event)"
        />
      </div>

      <div
        v-show="activePanel === 'style'"
        id="label-style-panel"
        role="tabpanel"
        aria-labelledby="label-style-tab"
      >
        <QrLabelStyleSettings v-model:label-style="labelStyle" />
      </div>
    </div>

    <footer class="label-controls__action">
      <a-button
        type="primary"
        size="large"
        block
        :loading="props.printing"
        :disabled="!props.batchNo || props.loadingPreview"
        @click="emit('print')"
      >
        <span aria-hidden="true">▣</span>
        打印当前批次
      </a-button>
      <p>关闭页眉页脚，并保持 100% 缩放。</p>
    </footer>
  </aside>
</template>

<style scoped>
.label-controls {
  position: sticky;
  top: 76px;
  display: grid;
  align-self: start;
  min-width: 0;
  height: calc(100vh - 96px);
  max-height: 680px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid #e1e8f0;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgb(30 64 175 / 7%);
}

.label-controls__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  padding: 7px;
  border-bottom: 1px solid #e7edf5;
  background: #f6f8fc;
}

.label-controls__tabs button {
  display: flex;
  min-width: 0;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #64748b;
  background: transparent;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.18s ease;
}

.label-controls__tabs button:hover {
  color: #2563eb;
  background: rgb(255 255 255 / 65%);
}

.label-controls__tabs .label-controls__tab--active {
  border-color: #dbe7fb;
  color: #1d4ed8;
  background: #ffffff;
  box-shadow: 0 3px 10px rgb(37 99 235 / 9%);
}

.label-controls__tabs span {
  color: #2f6fed;
  font-size: 9px;
}

.label-controls__tabs button:focus-visible {
  outline: 3px solid rgb(59 130 246 / 24%);
  outline-offset: 1px;
}

.label-controls__viewport {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.label-controls__viewport::-webkit-scrollbar {
  width: 6px;
}

.label-controls__viewport::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #d8e1ec;
}

.label-controls__action {
  position: relative;
  z-index: 2;
  padding: 13px 17px 11px;
  border-top: 1px solid #e7edf5;
  background: #ffffff;
  box-shadow: 0 -8px 18px rgb(30 64 175 / 4%);
}

.label-controls__action :deep(.ant-btn) {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgb(37 99 235 / 20%);
}

.label-controls__action p {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1.4;
  text-align: center;
}

@media (max-width: 1050px) {
  .label-controls {
    position: static;
    height: auto;
    max-height: none;
  }

  .label-controls__viewport {
    overflow: visible;
  }
}
</style>
