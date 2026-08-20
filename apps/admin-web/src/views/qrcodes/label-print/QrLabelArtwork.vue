<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import type { CSSProperties } from 'vue'
import type { QrLabelBatch, QrLabelItem } from '@/api/qrcodes'
import type {
  LabelBlockKey,
  LabelDimensions,
  LabelField,
  LabelLayout,
  LabelStyleConfig,
} from './useQrLabelPrint'

const props = defineProps<{
  batch: QrLabelBatch
  item: QrLabelItem
  companyName: string
  selectedFields: readonly LabelField[]
  dimensions: LabelDimensions
  qrDataUrl: string
  labelStyle: LabelStyleConfig
  layout: LabelLayout
  editable?: boolean
}>()
const emit = defineEmits<{
  'update:layout': [value: LabelLayout]
}>()

interface DragState {
  block: LabelBlockKey
  pointerId: number
  startClientX: number
  startClientY: number
  startPosition: { x: number; y: number }
}

const artworkRef = useTemplateRef<HTMLElement>('artwork')
const dragState = shallowRef<DragState | null>(null)
const selectedBlock = shallowRef<LabelBlockKey | null>(null)

const artworkStyle = computed(() => {
  const scale = Math.max(
    0.76,
    Math.min(3.4, props.dimensions.width / 30, props.dimensions.height / 90),
  )
  const qrSize = Math.max(
    16,
    Math.min(props.dimensions.width * 0.62, props.dimensions.height * 0.28),
  )
  const items =
    props.labelStyle.alignment === 'left'
      ? 'flex-start'
      : props.labelStyle.alignment === 'right'
        ? 'flex-end'
        : 'center'
  return {
    width: `${props.dimensions.width}mm`,
    height: `${props.dimensions.height}mm`,
    color: props.labelStyle.textColor,
    backgroundColor: props.labelStyle.backgroundColor,
    '--label-scale': String(scale * props.labelStyle.fontScale / 100),
    '--qr-size': `${Math.max(
      16,
      qrSize * props.labelStyle.qrScale / 100,
    )}mm`,
    '--label-accent': props.labelStyle.accentColor,
    '--label-align': props.labelStyle.alignment,
    '--label-items': items,
    '--label-border-style': props.labelStyle.borderStyle,
  }
})

const materialText = computed(() => {
  const fabric = props.batch.fabricInfo
    .split(/[，,；;]/)
    .map((item) => item.trim())
    .find(Boolean)
  return [props.batch.style || props.batch.productCode, fabric]
    .filter(Boolean)
    .join(' · ')
})

const hasIdentity = computed(() =>
  ['product', 'batch', 'material', 'size'].some((field) =>
    props.selectedFields.includes(field as LabelField),
  ),
)

const blockStyles = computed<Record<LabelBlockKey, CSSProperties>>(() => ({
  company: {
    left: `${props.layout.company.x}%`,
    top: `${props.layout.company.y}%`,
  },
  identity: {
    left: `${props.layout.identity.x}%`,
    top: `${props.layout.identity.y}%`,
  },
  qrcode: {
    left: `${props.layout.qrcode.x}%`,
    top: `${props.layout.qrcode.y}%`,
  },
}))

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function updateBlockPosition(
  block: LabelBlockKey,
  element: HTMLElement,
  x: number,
  y: number,
) {
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (!artworkRect?.width || !artworkRect.height) return

  const blockRect = element.getBoundingClientRect()
  const horizontalInset = Math.min(
    48,
    (blockRect.width / 2 / artworkRect.width) * 100 + 2,
  )
  const verticalInset = Math.min(
    48,
    (blockRect.height / 2 / artworkRect.height) * 100 + 2,
  )
  const nextPosition = {
    x: Number(clamp(x, horizontalInset, 100 - horizontalInset).toFixed(2)),
    y: Number(clamp(y, verticalInset, 100 - verticalInset).toFixed(2)),
  }

  emit('update:layout', {
    ...props.layout,
    [block]: nextPosition,
  })
}

function startDrag(event: PointerEvent, block: LabelBlockKey) {
  if (!props.editable || event.button !== 0) return
  const element = event.currentTarget as HTMLElement
  event.preventDefault()
  element.setPointerCapture(event.pointerId)
  selectedBlock.value = block
  dragState.value = {
    block,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPosition: { ...props.layout[block] },
  }
}

function moveDrag(event: PointerEvent) {
  const state = dragState.value
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (
    !props.editable ||
    !state ||
    state.pointerId !== event.pointerId ||
    !artworkRect?.width ||
    !artworkRect.height
  ) return

  const element = event.currentTarget as HTMLElement
  const x = state.startPosition.x +
    ((event.clientX - state.startClientX) / artworkRect.width) * 100
  const y = state.startPosition.y +
    ((event.clientY - state.startClientY) / artworkRect.height) * 100
  updateBlockPosition(state.block, element, x, y)
}

function finishDrag(event: PointerEvent) {
  const state = dragState.value
  if (!state || state.pointerId !== event.pointerId) return
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  dragState.value = null
}

function moveWithKeyboard(event: KeyboardEvent, block: LabelBlockKey) {
  if (!props.editable) return
  const movement = event.shiftKey ? 5 : 1
  const delta = {
    ArrowLeft: { x: -movement, y: 0 },
    ArrowRight: { x: movement, y: 0 },
    ArrowUp: { x: 0, y: -movement },
    ArrowDown: { x: 0, y: movement },
  }[event.key]
  if (!delta) return

  event.preventDefault()
  selectedBlock.value = block
  const current = props.layout[block]
  updateBlockPosition(
    block,
    event.currentTarget as HTMLElement,
    current.x + delta.x,
    current.y + delta.y,
  )
}

function shown(field: LabelField) {
  return props.selectedFields.includes(field)
}
</script>

<template>
  <article
    ref="artwork"
    class="qr-label-artwork"
    :class="[
      `qr-label-artwork--${labelStyle.presetKey}`,
      { 'qr-label-artwork--editable': editable },
    ]"
    :style="artworkStyle"
  >
    <div class="qr-label-artwork__content">
      <header
        v-if="shown('company')"
        class="qr-label-artwork__company qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'company',
        }"
        :style="blockStyles.company"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        aria-label="拖动公司名称调整位置"
        @pointerdown="startDrag($event, 'company')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'company')"
      >
        {{ companyName.trim() || '请输入公司名称' }}
      </header>

      <div
        v-if="hasIdentity"
        class="qr-label-artwork__identity qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'identity',
        }"
        :style="blockStyles.identity"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        aria-label="拖动产品信息调整位置"
        @pointerdown="startDrag($event, 'identity')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'identity')"
      >
        <strong v-if="shown('product')" class="qr-label-artwork__product">
          {{ batch.productName }}
        </strong>
        <span v-if="shown('batch')" class="qr-label-artwork__line">
          批次 {{ batch.batchNo }}
        </span>
        <span v-if="shown('material')" class="qr-label-artwork__line">
          {{ materialText || '-' }}
        </span>
        <span v-if="shown('size')" class="qr-label-artwork__size">
          尺码 {{ item.size || item.productSku || '-' }}
        </span>
      </div>

      <div
        v-if="shown('qrcode')"
        class="qr-label-artwork__qr-block qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'qrcode',
        }"
        :style="blockStyles.qrcode"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        aria-label="拖动二维码调整位置"
        @pointerdown="startDrag($event, 'qrcode')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'qrcode')"
      >
        <img
          v-if="qrDataUrl"
          class="qr-label-artwork__qr"
          :src="qrDataUrl"
          :alt="`二维码 ${item.code}`"
        />
        <span v-else class="qr-label-artwork__qr-placeholder">QR</span>
        <span class="qr-label-artwork__code">{{ item.code }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.qr-label-artwork {
  position: relative;
  overflow: hidden;
  flex: none;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}

.qr-label-artwork::before {
  position: absolute;
  inset: 1.5mm;
  border-width: 0.18mm;
  border-style: var(--label-border-style);
  border-color: var(--label-accent);
  content: "";
  pointer-events: none;
}

.qr-label-artwork--brand::after {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  height: calc(1.4mm * var(--label-scale));
  background: var(--label-accent);
  content: "";
  pointer-events: none;
}

.qr-label-artwork--minimal::before {
  display: none;
}

.qr-label-artwork__content {
  position: relative;
  height: 100%;
  text-align: var(--label-align);
}

.qr-label-artwork__block {
  position: absolute;
  z-index: 2;
  max-width: calc(100% - 5.2mm);
  transform: translate(-50%, -50%);
}

.qr-label-artwork--editable .qr-label-artwork__block {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.qr-label-artwork--editable .qr-label-artwork__block:active {
  cursor: grabbing;
}

.qr-label-artwork--editable .qr-label-artwork__block:hover,
.qr-label-artwork--editable .qr-label-artwork__block:focus-visible,
.qr-label-artwork--editable .qr-label-artwork__block--selected {
  border-radius: 0.8mm;
  outline: 0.18mm dashed var(--label-accent);
  outline-offset: 0.8mm;
}

.qr-label-artwork__company {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: calc(1.85mm * var(--label-scale));
  font-weight: 800;
  line-height: 1.24;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-label-artwork__identity {
  display: flex;
  align-items: var(--label-items);
  flex-direction: column;
  gap: calc(0.55mm * var(--label-scale));
}

.qr-label-artwork__product {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(1.55mm * var(--label-scale));
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-label-artwork__line,
.qr-label-artwork__size,
.qr-label-artwork__code {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: calc(1.08mm * var(--label-scale));
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-label-artwork__line,
.qr-label-artwork__code {
  opacity: 0.72;
}

.qr-label-artwork__size {
  color: var(--label-accent);
  font-weight: 700;
}

.qr-label-artwork__qr-block {
  display: flex;
  align-items: var(--label-items);
  flex-direction: column;
  gap: calc(0.7mm * var(--label-scale));
}

.qr-label-artwork__qr,
.qr-label-artwork__qr-placeholder {
  width: var(--qr-size);
  height: var(--qr-size);
}

.qr-label-artwork__qr {
  display: block;
  background: #ffffff;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}

.qr-label-artwork__qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.2mm solid #cbd5e1;
  color: #64748b;
  background: #f8fafc;
  font-size: calc(1.4mm * var(--label-scale));
}

.qr-label-artwork__code {
  max-width: calc(var(--qr-size) * 1.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: calc(0.75mm * var(--label-scale));
  letter-spacing: -0.02em;
}
</style>
