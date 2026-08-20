<script setup lang="ts">
import { computed } from 'vue'
import type { QrLabelBatch, QrLabelItem } from '@/api/qrcodes'
import QrLabelArtwork from './QrLabelArtwork.vue'
import {
  createDefaultLabelLayout,
  type LabelLayout,
  type LabelDimensions,
  type LabelField,
  type LabelStyleConfig,
} from './useQrLabelPrint'

const props = defineProps<{
  batch: QrLabelBatch | null
  item: QrLabelItem | null
  companyName: string
  selectedFields: readonly LabelField[]
  dimensions: LabelDimensions
  labelStyle: LabelStyleConfig
  qrDataUrl: string
  loading: boolean
}>()
const labelLayout = defineModel<LabelLayout>('labelLayout', { required: true })

const millimeterToPixel = 3.7795275591
const previewScale = computed(() => {
  const rawWidth = props.dimensions.width * millimeterToPixel
  const rawHeight = props.dimensions.height * millimeterToPixel
  return Math.min(1.35, 560 / rawWidth, 470 / rawHeight)
})
const frameStyle = computed(() => ({
  width: `${props.dimensions.width * millimeterToPixel * previewScale.value}px`,
  height: `${props.dimensions.height * millimeterToPixel * previewScale.value}px`,
}))
const artworkWrapStyle = computed(() => ({
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'left top',
}))
const sizeCaption = computed(() => {
  const width = Number((props.dimensions.width / 10).toFixed(1))
  const height = Number((props.dimensions.height / 10).toFixed(1))
  const area = Number((width * height).toFixed(1))
  return `${width} × ${height} cm · 面积 ${area} cm² · 显示 ${props.selectedFields.length}/6 项`
})

function resetLayout() {
  labelLayout.value = createDefaultLabelLayout()
}
</script>

<template>
  <section class="label-preview-card">
    <header class="label-preview-card__header">
      <div>
        <span class="label-preview-card__eyebrow">PRINT BED / 实时校样</span>
        <h3>标签预览</h3>
      </div>
      <div class="label-preview-card__tools">
        <span>拖动内容调整位置</span>
        <button type="button" @click="resetLayout">复位布局</button>
      </div>
    </header>

    <div class="label-preview-card__stage">
      <a-spin v-if="loading" tip="正在生成预览…" />
      <a-empty
        v-else-if="!batch || !item"
        description="暂无已绑定二维码的生产批次"
      />
      <div v-else class="label-preview-card__sample">
        <div class="label-preview-card__frame" :style="frameStyle">
          <div :style="artworkWrapStyle">
            <QrLabelArtwork
              :batch="batch"
              :item="item"
              :company-name="companyName"
              :selected-fields="selectedFields"
              :dimensions="dimensions"
              :label-style="labelStyle"
              :layout="labelLayout"
              :qr-data-url="qrDataUrl"
              editable
              @update:layout="labelLayout = $event"
            />
          </div>
        </div>
        <p>{{ sizeCaption }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.label-preview-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e1e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgb(30 64 175 / 5%);
}

.label-preview-card__header {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 22px;
  border-bottom: 1px solid #edf1f6;
}

.label-preview-card__eyebrow {
  color: #2f6fed;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.label-preview-card__header h3 {
  margin: 5px 0 0;
  color: #172033;
  font-size: 16px;
}

.label-preview-card__tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-preview-card__tools span,
.label-preview-card__tools button {
  padding: 6px 9px;
  border-radius: 8px;
  font-size: 11px;
}

.label-preview-card__tools span {
  color: #64748b;
  background: #f1f5f9;
}

.label-preview-card__tools button {
  border: 1px solid #dbe7fb;
  color: #2563eb;
  background: #f7faff;
  cursor: pointer;
}

.label-preview-card__tools button:hover {
  border-color: #2f6fed;
  background: #eff5ff;
}

.label-preview-card__tools button:focus-visible {
  outline: 3px solid rgb(59 130 246 / 24%);
  outline-offset: 2px;
}

.label-preview-card__stage {
  display: flex;
  min-height: 560px;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 30px;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 38%) 1px, transparent 1px),
    linear-gradient(rgb(255 255 255 / 38%) 1px, transparent 1px),
    #edf2f8;
  background-size: 20px 20px;
}

.label-preview-card__sample {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 14px;
}

.label-preview-card__frame {
  overflow: hidden;
  border: 1px dashed #c4ceda;
  background: #ffffff;
  box-shadow: 0 15px 30px rgb(51 65 85 / 15%);
}

.label-preview-card__sample p {
  margin: 0;
  color: #536785;
  font-size: 12px;
  letter-spacing: 0.02em;
}

@media (max-width: 900px) {
  .label-preview-card__stage {
    min-height: 480px;
  }
}

@media (max-width: 520px) {
  .label-preview-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .label-preview-card__tools {
    flex-wrap: wrap;
  }

  .label-preview-card__stage {
    min-height: 420px;
    padding: 18px;
  }
}
</style>
