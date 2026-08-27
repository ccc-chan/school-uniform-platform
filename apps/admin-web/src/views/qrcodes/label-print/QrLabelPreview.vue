<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { QrLabelBatch, QrLabelItem } from '@/api/qrcodes'
import QrLabelArtwork from './QrLabelArtwork.vue'
import {
  createDefaultLabelLayout,
  type CustomLabelLayer,
  type LabelDimensions,
  type LabelField,
  type LabelLayout,
  type LabelStyleConfig,
} from './useQrLabelPrint'

const props = defineProps<{
  batch: QrLabelBatch | null
  item: QrLabelItem | null
  companyName: string
  selectedFields: readonly LabelField[]
  dimensions: LabelDimensions
  qrDataUrl: string
  labelImageUrl: string
  loading: boolean
}>()
const labelLayout = defineModel<LabelLayout>('labelLayout', { required: true })
const customLayers = defineModel<CustomLabelLayer[]>('customLayers', { required: true })
const labelStyle = defineModel<LabelStyleConfig>('labelStyle', { required: true })

const millimeterToPixel = 3.7795275591
const zoom = shallowRef(1)

const fitScale = computed(() => {
  const rawWidth = props.dimensions.width * millimeterToPixel
  const rawHeight = props.dimensions.height * millimeterToPixel
  return Math.min(1.45, 520 / rawWidth, 555 / rawHeight)
})
const previewScale = computed(() => fitScale.value * zoom.value)
const zoomPercent = computed(() => Math.round(zoom.value * 100))
const frameStyle = computed(() => ({
  width: `${props.dimensions.width * millimeterToPixel * previewScale.value}px`,
  height: `${props.dimensions.height * millimeterToPixel * previewScale.value}px`,
}))
const artworkWrapStyle = computed(() => ({
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'left top',
}))

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function changeZoom(change: number) {
  zoom.value = Number(clamp(zoom.value + change, 0.5, 2).toFixed(2))
}

function handleWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) return

  event.preventDefault()
  event.stopPropagation()
  changeZoom(event.deltaY > 0 ? -0.08 : 0.08)
}

function fitCanvas() {
  zoom.value = 1
}

function resetLayout() {
  labelLayout.value = createDefaultLabelLayout()
}

</script>

<template>
  <section class="label-preview">
    <header class="label-preview__header">
      <h2>实时预览</h2>
      <div class="label-preview__tools">
        <button type="button" @click="fitCanvas">适应画布</button>
        <div class="label-preview__zoom" aria-label="预览缩放">
          <button type="button" aria-label="缩小" @click="changeZoom(-0.1)">−</button>
          <span>{{ zoomPercent }}%</span>
          <button type="button" aria-label="放大" @click="changeZoom(0.1)">＋</button>
        </div>
        <button type="button" @click="resetLayout">复位布局</button>
      </div>
    </header>

    <div class="label-preview__stage">
      <a-spin v-if="loading" tip="正在生成预览…" />
      <a-empty
        v-else-if="!batch || !item"
        description="暂无已绑定二维码的生产批次"
      />
      <template v-else>
        <span class="label-preview__guide label-preview__guide--x" aria-hidden="true" />
        <span class="label-preview__guide label-preview__guide--y" aria-hidden="true" />
        <div
          class="label-preview__frame"
          :style="frameStyle"
          title="滚轮滚动画布；Ctrl / ⌘ + 滚轮缩放；选中元素后可用方向键移动"
          @wheel="handleWheel"
        >
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
              :label-image-url="labelImageUrl"
              :custom-layers="customLayers"
              editable
              @update:layout="labelLayout = $event"
              @update:custom-layers="customLayers = $event"
              @update:label-style="labelStyle = $event"
            />
          </div>
        </div>
      </template>
    </div>

    <footer class="label-preview__footer">
      <span>辅助线不会打印 · 拖动方块缩放，方向键微调位置</span>
      <strong>{{ dimensions.width }} × {{ dimensions.height }} mm</strong>
    </footer>
  </section>
</template>

<style scoped>
.label-preview {
  display: grid;
  min-width: 0;
  height: 100%;
  grid-template-rows: 49px minmax(0, 1fr) 32px;
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: 3px;
  background: #ffffff;
}

.label-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 13px 0 16px;
  border-bottom: 1px solid #e5eaf1;
}

.label-preview__header h2 {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 650;
}

.label-preview__tools,
.label-preview__zoom {
  display: flex;
  align-items: center;
}

.label-preview__tools {
  gap: 7px;
}

.label-preview__tools button,
.label-preview__zoom span {
  height: 28px;
  border: 1px solid #dfe5ed;
  color: #394454;
  background: #ffffff;
  font-size: 10px;
}

.label-preview__tools > button {
  padding: 0 11px;
  border-radius: 3px;
}

.label-preview__zoom button {
  width: 28px;
  padding: 0;
}

.label-preview__zoom button:first-child {
  border-radius: 3px 0 0 3px;
}

.label-preview__zoom button:last-child {
  border-radius: 0 3px 3px 0;
}

.label-preview__zoom span {
  display: flex;
  width: 58px;
  align-items: center;
  justify-content: center;
  border-width: 1px 0;
  color: #111827;
  font-weight: 650;
}

.label-preview__tools button:hover {
  border-color: #85b8ff;
  color: #1677ff;
  background: #f5f9ff;
}

.label-preview__stage {
  position: relative;
  display: flex;
  min-height: 0;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: auto;
  padding: 24px;
  background: #f4f6f9;
  scrollbar-width: none;
}

.label-preview__stage::-webkit-scrollbar {
  display: none;
}

.label-preview__guide {
  position: absolute;
  z-index: 0;
  display: block;
  pointer-events: none;
}

.label-preview__guide--x {
  top: 50%;
  right: 0;
  left: 0;
  border-top: 1px dashed rgb(22 119 255 / 55%);
}

.label-preview__guide--y {
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 1px dashed rgb(22 119 255 / 55%);
}

.label-preview__frame {
  z-index: 1;
  flex: none;
  margin: auto;
  overflow: hidden;
  border: 1px solid #d8dee8;
  background: #ffffff;
  box-shadow: 0 8px 22px rgb(31 45 68 / 12%);
  user-select: none;
}

.label-preview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-top: 1px solid #e5eaf1;
  color: #8a96a8;
  background: #fafbfc;
  font-size: 9px;
}

.label-preview__footer strong {
  color: #5c6879;
  font-weight: 600;
}

.label-preview button:focus-visible {
  outline: 2px solid rgb(22 119 255 / 35%);
  outline-offset: 1px;
}

@media (max-width: 720px) {
  .label-preview__header {
    min-height: 88px;
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
  }

  .label-preview__tools {
    flex-wrap: wrap;
  }

  .label-preview__stage {
    min-height: 520px;
  }
}
</style>
