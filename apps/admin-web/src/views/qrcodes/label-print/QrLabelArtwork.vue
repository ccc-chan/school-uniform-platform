<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import type { CSSProperties } from 'vue'
import type { QrLabelBatch, QrLabelItem } from '@/api/qrcodes'
import {
  DEFAULT_LABEL_CODE_SCALE,
  createDefaultLabelCodeStyle,
  type CustomLabelLayer,
  type LabelBlockKey,
  type LabelDimensions,
  type LabelField,
  type LabelLayout,
  type LabelStyleConfig,
} from './useQrLabelPrint'

const props = defineProps<{
  batch: QrLabelBatch
  item: QrLabelItem
  companyName: string
  selectedFields: readonly LabelField[]
  dimensions: LabelDimensions
  qrDataUrl: string
  labelImageUrl: string
  labelStyle: LabelStyleConfig
  layout: LabelLayout
  customLayers: readonly CustomLabelLayer[]
  editable?: boolean
}>()
const emit = defineEmits<{
  'update:layout': [value: LabelLayout]
  'update:customLayers': [value: CustomLabelLayer[]]
  'update:labelStyle': [value: LabelStyleConfig]
}>()

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface ResizeDirections {
  x: -1 | 0 | 1
  y: -1 | 0 | 1
}

interface DragState {
  block: LabelBlockKey
  pointerId: number
  startClientX: number
  startClientY: number
  startPosition: { x: number; y: number }
}

interface CustomDragState {
  layerId: string
  pointerId: number
  startClientX: number
  startClientY: number
  startPosition: { x: number; y: number }
}

interface CustomResizeState {
  layerId: string
  layerType: CustomLabelLayer['type']
  handle: ResizeHandle
  pointerId: number
  startClientX: number
  startClientY: number
  startGeometry: {
    x: number
    y: number
    width: number
    height: number
    fontScale: number
  }
}

interface QrResizeState {
  handle: ResizeHandle
  pointerId: number
  startClientX: number
  startClientY: number
  startSize: number
  startScale: number
  startPosition: { x: number; y: number }
}

interface CodeResizeState {
  handle: ResizeHandle
  pointerId: number
  startClientX: number
  startClientY: number
  startWidth: number
  startHeight: number
  startScale: number
  startPosition: { x: number; y: number }
}

const boxResizeHandles: readonly ResizeHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
]
const dividerResizeHandles: readonly ResizeHandle[] = ['w', 'e']
const resizeDirections: Record<ResizeHandle, ResizeDirections> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
}

const artworkRef = useTemplateRef<HTMLElement>('artwork')
const dragState = shallowRef<DragState | null>(null)
const selectedBlock = shallowRef<LabelBlockKey | null>(null)
const customDragState = shallowRef<CustomDragState | null>(null)
const selectedCustomLayerId = shallowRef<string | null>(null)
const customResizeState = shallowRef<CustomResizeState | null>(null)
const qrResizeState = shallowRef<QrResizeState | null>(null)
const codeResizeState = shallowRef<CodeResizeState | null>(null)

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
    '--label-scale': String((scale * props.labelStyle.fontScale) / 100),
    '--qr-size': `${Math.max(8, (qrSize * props.labelStyle.qrScale) / 100)}mm`,
    '--label-image-width': `${Math.max(
      12,
      Math.min(props.dimensions.width * 0.68, props.dimensions.height * 0.24),
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
  image: {
    left: `${props.layout.image.x}%`,
    top: `${props.layout.image.y}%`,
  },
  identity: {
    left: `${props.layout.identity.x}%`,
    top: `${props.layout.identity.y}%`,
  },
  qrcode: {
    left: `${props.layout.qrcode.x}%`,
    top: `${props.layout.qrcode.y}%`,
  },
  code: {
    left: `${props.layout.code.x}%`,
    top: `${props.layout.code.y}%`,
  },
}))

const codeTextStyle = computed(() => ({
  ...createDefaultLabelCodeStyle(),
  ...props.labelStyle.codeStyle,
  fontScale:
    props.labelStyle.codeStyle?.fontScale ??
    props.labelStyle.codeScale ??
    DEFAULT_LABEL_CODE_SCALE,
}))

const codeBlockStyle = computed<CSSProperties>(() => {
  const style = codeTextStyle.value
  const textDecoration =
    [
      style.underline ? 'underline' : '',
      style.strikethrough ? 'line-through' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'none'

  return {
    ...blockStyles.value.code,
    alignItems:
      style.verticalAlignment === 'top'
        ? 'flex-start'
        : style.verticalAlignment === 'bottom'
          ? 'flex-end'
          : 'center',
    justifyContent:
      style.alignment === 'left'
        ? 'flex-start'
        : style.alignment === 'right'
          ? 'flex-end'
          : 'center',
    color: style.textColor || props.labelStyle.textColor,
    backgroundColor: style.backgroundColor || 'transparent',
    fontFamily: style.fontFamily,
    fontSize: `calc(${((style.fontSize * style.fontScale) / 100).toFixed(
      2,
    )}px * var(--label-scale))`,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    letterSpacing: `${style.letterSpacing}px`,
    lineHeight: String(style.lineHeight),
    textDecoration,
    textAlign: style.alignment,
  }
})

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function resizeAxis(
  center: number,
  size: number,
  delta: number,
  direction: -1 | 0 | 1,
  minimumSize: number,
) {
  if (direction === 0) return { center, size }

  const start = center - size / 2
  const end = center + size / 2
  if (direction < 0) {
    const nextStart = clamp(start + delta, 1, end - minimumSize)
    return {
      center: (nextStart + end) / 2,
      size: end - nextStart,
    }
  }

  const nextEnd = clamp(end + delta, start + minimumSize, 99)
  return {
    center: (start + nextEnd) / 2,
    size: nextEnd - start,
  }
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
  selectedCustomLayerId.value = null
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
  )
    return

  const element = event.currentTarget as HTMLElement
  const x =
    state.startPosition.x +
    ((event.clientX - state.startClientX) / artworkRect.width) * 100
  const y =
    state.startPosition.y +
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
  selectedCustomLayerId.value = null
  const current = props.layout[block]
  updateBlockPosition(
    block,
    event.currentTarget as HTMLElement,
    current.x + delta.x,
    current.y + delta.y,
  )
}

function customLayerStyle(layer: CustomLabelLayer): CSSProperties {
  const verticalAlignment = layer.verticalAlignment ?? 'middle'
  const layerHeight = layer.height ?? (layer.type === 'text' ? 4 : 8)

  return {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}%`,
    height: layer.type === 'divider' ? undefined : `${layerHeight}%`,
    display: layer.type === 'text' ? 'flex' : undefined,
    flexDirection: layer.type === 'text' ? 'column' : undefined,
    justifyContent:
      verticalAlignment === 'top'
        ? 'flex-start'
        : verticalAlignment === 'bottom'
          ? 'flex-end'
          : 'center',
    textAlign: layer.alignment,
  }
}

function customTextStyle(layer: CustomLabelLayer): CSSProperties {
  const fontScale = layer.fontScale ?? 100
  const italic = layer.italic === true
  const textDecoration =
    [
      layer.underline ? 'underline' : '',
      layer.strikethrough ? 'line-through' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'none'
  const transformOrigin =
    layer.alignment === 'left'
      ? 'left center'
      : layer.alignment === 'right'
        ? 'right center'
        : 'center'

  return {
    color: layer.textColor || props.labelStyle.textColor,
    backgroundColor: layer.backgroundColor || 'transparent',
    fontFamily:
      layer.fontFamily || '"Source Han Sans SC", "PingFang SC", sans-serif',
    fontSize: `calc(${(((layer.fontSize ?? 14) * fontScale) / 100).toFixed(2)}px * var(--label-scale))`,
    fontWeight: layer.bold ? 700 : 400,
    fontStyle: italic ? 'italic' : 'normal',
    letterSpacing: `${layer.letterSpacing ?? 0}px`,
    lineHeight: String(layer.lineHeight ?? 1.2),
    textDecoration,
    transform: italic ? 'skewX(-12deg)' : 'none',
    transformOrigin,
  }
}

function customTextRowStyle(layer: CustomLabelLayer): CSSProperties {
  const imageVerticalAlignment = layer.imageVerticalAlignment ?? 'middle'

  return {
    gap: `${layer.imageGap ?? 8}px`,
    alignItems:
      imageVerticalAlignment === 'top'
        ? 'flex-start'
        : imageVerticalAlignment === 'bottom'
          ? 'flex-end'
          : 'center',
  }
}

function associatedImageStyle(layer: CustomLabelLayer): CSSProperties {
  const imageSize = layer.imageSize ?? 20
  return {
    width: `${imageSize}px`,
    height: `${imageSize}px`,
  }
}

function updateCustomLayer(layerId: string, patch: Partial<CustomLabelLayer>) {
  emit(
    'update:customLayers',
    props.customLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...patch } : layer,
    ),
  )
}

function selectCustomLayer(layerId: string) {
  selectedCustomLayerId.value = layerId
  selectedBlock.value = null
}

function startCustomResize(
  event: PointerEvent,
  layer: CustomLabelLayer,
  handle: ResizeHandle,
) {
  if (!props.editable || event.button !== 0) return
  const element = event.currentTarget as HTMLElement
  event.preventDefault()
  element.setPointerCapture(event.pointerId)
  selectCustomLayer(layer.id)
  customDragState.value = null
  customResizeState.value = {
    layerId: layer.id,
    layerType: layer.type,
    handle,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startGeometry: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height ?? (layer.type === 'text' ? 4 : 8),
      fontScale: layer.fontScale ?? 100,
    },
  }
}

function moveCustomResize(event: PointerEvent) {
  const state = customResizeState.value
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (
    !props.editable ||
    !state ||
    state.pointerId !== event.pointerId ||
    !artworkRect?.width ||
    !artworkRect.height
  )
    return

  const directions = resizeDirections[state.handle]
  const deltaX =
    ((event.clientX - state.startClientX) / artworkRect.width) * 100
  const deltaY =
    ((event.clientY - state.startClientY) / artworkRect.height) * 100
  const horizontal = resizeAxis(
    state.startGeometry.x,
    state.startGeometry.width,
    deltaX,
    directions.x,
    state.layerType === 'divider' ? 8 : 6,
  )
  const vertical = resizeAxis(
    state.startGeometry.y,
    state.startGeometry.height,
    deltaY,
    directions.y,
    state.layerType === 'text' ? 3 : 5,
  )
  const patch: Partial<CustomLabelLayer> = {
    x: Number(horizontal.center.toFixed(2)),
    width: Number(horizontal.size.toFixed(2)),
  }

  if (state.layerType !== 'divider') {
    patch.y = Number(vertical.center.toFixed(2))
    patch.height = Number(vertical.size.toFixed(2))
  }
  if (state.layerType === 'text' && directions.y !== 0) {
    patch.fontScale = Math.round(
      clamp(
        state.startGeometry.fontScale *
          (vertical.size / state.startGeometry.height),
        50,
        200,
      ),
    )
  }
  updateCustomLayer(state.layerId, patch)
}

function finishCustomResize(event: PointerEvent) {
  const state = customResizeState.value
  if (!state || state.pointerId !== event.pointerId) return
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  customResizeState.value = null
}

function startQrResize(event: PointerEvent, handle: ResizeHandle) {
  if (!props.editable || event.button !== 0) return
  const element = event.currentTarget as HTMLElement
  const block = element.parentElement
  if (!block) return

  event.preventDefault()
  block.focus({ preventScroll: true })
  element.setPointerCapture(event.pointerId)
  selectedBlock.value = 'qrcode'
  selectedCustomLayerId.value = null
  dragState.value = null
  qrResizeState.value = {
    handle,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startSize: block.getBoundingClientRect().width,
    startScale: props.labelStyle.qrScale,
    startPosition: { ...props.layout.qrcode },
  }
}

function moveQrResize(event: PointerEvent) {
  const state = qrResizeState.value
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (
    !props.editable ||
    !state ||
    state.pointerId !== event.pointerId ||
    !artworkRect?.width ||
    !artworkRect.height
  )
    return

  const directions = resizeDirections[state.handle]
  const signedDeltas: number[] = []
  if (directions.x !== 0) {
    signedDeltas.push(directions.x * (event.clientX - state.startClientX))
  }
  if (directions.y !== 0) {
    signedDeltas.push(directions.y * (event.clientY - state.startClientY))
  }
  const sizeDelta =
    signedDeltas.reduce((sum, value) => sum + value, 0) / signedDeltas.length
  const maximumSize = Math.min(artworkRect.width, artworkRect.height) * 0.92
  const requestedSize = clamp(state.startSize + sizeDelta, 24, maximumSize)
  const nextScale = Math.round(
    clamp(state.startScale * (requestedSize / state.startSize), 50, 180),
  )
  const actualSizeDelta = state.startSize * (nextScale / state.startScale - 1)
  const nextPosition = {
    x: Number(
      clamp(
        state.startPosition.x +
          (directions.x * actualSizeDelta * 50) / artworkRect.width,
        2,
        98,
      ).toFixed(2),
    ),
    y: Number(
      clamp(
        state.startPosition.y +
          (directions.y * actualSizeDelta * 50) / artworkRect.height,
        2,
        98,
      ).toFixed(2),
    ),
  }

  emit('update:labelStyle', {
    ...props.labelStyle,
    qrScale: nextScale,
  })
  emit('update:layout', {
    ...props.layout,
    qrcode: nextPosition,
  })
}

function finishQrResize(event: PointerEvent) {
  const state = qrResizeState.value
  if (!state || state.pointerId !== event.pointerId) return
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  qrResizeState.value = null
}

function startCodeResize(event: PointerEvent, handle: ResizeHandle) {
  if (!props.editable || event.button !== 0) return
  const element = event.currentTarget as HTMLElement
  const block = element.parentElement
  if (!block) return

  event.preventDefault()
  block.focus({ preventScroll: true })
  element.setPointerCapture(event.pointerId)
  selectedBlock.value = 'code'
  selectedCustomLayerId.value = null
  dragState.value = null
  const blockRect = block.getBoundingClientRect()
  codeResizeState.value = {
    handle,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startWidth: blockRect.width,
    startHeight: blockRect.height,
    startScale: codeTextStyle.value.fontScale,
    startPosition: { ...props.layout.code },
  }
}

function moveCodeResize(event: PointerEvent) {
  const state = codeResizeState.value
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (
    !props.editable ||
    !state ||
    state.pointerId !== event.pointerId ||
    !artworkRect?.width ||
    !artworkRect.height
  )
    return

  const directions = resizeDirections[state.handle]
  const deltaX = event.clientX - state.startClientX
  const deltaY = event.clientY - state.startClientY
  const scaleRatios: number[] = []

  if (directions.x !== 0) {
    scaleRatios.push(
      1 + (directions.x * deltaX) / Math.max(state.startWidth, 1),
    )
  }
  if (directions.y !== 0) {
    scaleRatios.push(
      1 + (directions.y * deltaY) / Math.max(state.startHeight, 1),
    )
  }

  const requestedRatio =
    scaleRatios.reduce((sum, value) => sum + value, 0) / scaleRatios.length
  const nextScale = Math.round(
    clamp(state.startScale * requestedRatio, 50, 300),
  )
  const actualRatio = nextScale / state.startScale
  const widthDelta = state.startWidth * (actualRatio - 1)
  const heightDelta = state.startHeight * (actualRatio - 1)
  const nextPosition = {
    x: Number(
      clamp(
        state.startPosition.x +
          (directions.x * widthDelta * 50) / artworkRect.width,
        2,
        98,
      ).toFixed(2),
    ),
    y: Number(
      clamp(
        state.startPosition.y +
          (directions.y * heightDelta * 50) / artworkRect.height,
        2,
        98,
      ).toFixed(2),
    ),
  }

  emit('update:labelStyle', {
    ...props.labelStyle,
    codeScale: nextScale,
    codeStyle: {
      ...codeTextStyle.value,
      fontScale: nextScale,
    },
  })
  emit('update:layout', {
    ...props.layout,
    code: nextPosition,
  })
}

function finishCodeResize(event: PointerEvent) {
  const state = codeResizeState.value
  if (!state || state.pointerId !== event.pointerId) return
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  codeResizeState.value = null
}

function startCustomDrag(event: PointerEvent, layer: CustomLabelLayer) {
  if (!props.editable || event.button !== 0) return
  const element = event.currentTarget as HTMLElement
  event.preventDefault()
  element.focus({ preventScroll: true })
  element.setPointerCapture(event.pointerId)
  selectCustomLayer(layer.id)
  customDragState.value = {
    layerId: layer.id,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPosition: { x: layer.x, y: layer.y },
  }
}

function moveCustomDrag(event: PointerEvent) {
  const state = customDragState.value
  const artworkRect = artworkRef.value?.getBoundingClientRect()
  if (
    !props.editable ||
    !state ||
    state.pointerId !== event.pointerId ||
    !artworkRect?.width ||
    !artworkRect.height
  )
    return

  const x =
    state.startPosition.x +
    ((event.clientX - state.startClientX) / artworkRect.width) * 100
  const y =
    state.startPosition.y +
    ((event.clientY - state.startClientY) / artworkRect.height) * 100
  updateCustomLayer(state.layerId, {
    x: Number(clamp(x, 5, 95).toFixed(2)),
    y: Number(clamp(y, 5, 95).toFixed(2)),
  })
}

function finishCustomDrag(event: PointerEvent) {
  const state = customDragState.value
  if (!state || state.pointerId !== event.pointerId) return
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
  customDragState.value = null
}

function moveCustomWithKeyboard(event: KeyboardEvent, layer: CustomLabelLayer) {
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
  selectedCustomLayerId.value = layer.id
  updateCustomLayer(layer.id, {
    x: clamp(layer.x + delta.x, 5, 95),
    y: clamp(layer.y + delta.y, 5, 95),
  })
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
      <div
        v-for="layer in customLayers"
        :key="layer.id"
        class="qr-label-artwork__custom-layer"
        :class="[
          `qr-label-artwork__custom-layer--${layer.type}`,
          {
            'qr-label-artwork__custom-layer--selected':
              selectedCustomLayerId === layer.id,
          },
        ]"
        :style="customLayerStyle(layer)"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        :aria-label="`${layer.name}，可拖动或使用方向键调整位置`"
        @focus="selectCustomLayer(layer.id)"
        @pointerdown.stop="startCustomDrag($event, layer)"
        @pointermove.stop="moveCustomDrag"
        @pointerup.stop="finishCustomDrag"
        @pointercancel.stop="finishCustomDrag"
        @keydown="moveCustomWithKeyboard($event, layer)"
      >
        <div
          v-if="layer.type === 'text'"
          class="qr-label-artwork__custom-text-row"
          :style="customTextRowStyle(layer)"
        >
          <img
            v-if="
              layer.associatedImageDataUrl &&
              (layer.imagePosition || 'before') === 'before'
            "
            class="qr-label-artwork__associated-image"
            :src="layer.associatedImageDataUrl"
            alt=""
            :style="associatedImageStyle(layer)"
          />
          <span
            class="qr-label-artwork__custom-text"
            :style="customTextStyle(layer)"
          >
            {{ layer.content || (editable ? '请输入内容' : '') }}
          </span>
          <img
            v-if="
              layer.associatedImageDataUrl && layer.imagePosition === 'after'
            "
            class="qr-label-artwork__associated-image"
            :src="layer.associatedImageDataUrl"
            alt=""
            :style="associatedImageStyle(layer)"
          />
        </div>
        <img
          v-else-if="layer.type === 'image'"
          class="qr-label-artwork__custom-image"
          :src="layer.imageDataUrl"
          :alt="layer.name"
        />
        <span v-else class="qr-label-artwork__custom-divider" />
        <span
          v-for="handle in layer.type === 'divider'
            ? dividerResizeHandles
            : boxResizeHandles"
          :key="handle"
          class="qr-label-artwork__resize-handle"
          :class="`qr-label-artwork__resize-handle--${handle}`"
          aria-hidden="true"
          @pointerdown.stop="startCustomResize($event, layer, handle)"
          @pointermove.stop="moveCustomResize"
          @pointerup.stop="finishCustomResize"
          @pointercancel.stop="finishCustomResize"
        />
      </div>

      <header
        v-if="shown('company')"
        class="qr-label-artwork__company qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'company',
        }"
        :style="blockStyles.company"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        aria-label="拖动文本调整位置"
        @pointerdown="startDrag($event, 'company')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'company')"
      >
        {{ companyName.trim() || '请输入内容' }}
      </header>

      <div
        v-if="labelImageUrl"
        class="qr-label-artwork__image-block qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'image',
        }"
        :style="blockStyles.image"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        aria-label="拖动图片调整位置"
        @pointerdown="startDrag($event, 'image')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'image')"
      >
        <img
          class="qr-label-artwork__image"
          :src="labelImageUrl"
          alt="标签图片"
        />
      </div>

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
        <span
          v-for="handle in boxResizeHandles"
          :key="handle"
          class="qr-label-artwork__resize-handle qr-label-artwork__resize-handle--qr"
          :class="`qr-label-artwork__resize-handle--${handle}`"
          aria-hidden="true"
          @pointerdown.stop="startQrResize($event, handle)"
          @pointermove.stop="moveQrResize"
          @pointerup.stop="finishQrResize"
          @pointercancel.stop="finishQrResize"
        />
      </div>

      <div
        class="qr-label-artwork__code qr-label-artwork__block"
        :class="{
          'qr-label-artwork__block--selected': selectedBlock === 'code',
        }"
        :style="codeBlockStyle"
        :tabindex="editable ? 0 : undefined"
        :role="editable ? 'button' : undefined"
        :aria-label="`二维码编号 ${item.code}，可拖动或使用方向键调整位置`"
        @pointerdown="startDrag($event, 'code')"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @keydown="moveWithKeyboard($event, 'code')"
      >
        {{ item.code }}
        <span
          v-for="handle in boxResizeHandles"
          :key="handle"
          class="qr-label-artwork__resize-handle"
          :class="`qr-label-artwork__resize-handle--${handle}`"
          aria-hidden="true"
          @pointerdown.stop="startCodeResize($event, handle)"
          @pointermove.stop="moveCodeResize"
          @pointerup.stop="finishCodeResize"
          @pointercancel.stop="finishCodeResize"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.qr-label-artwork {
  --label-editor-color: #94a3b8;

  position: relative;
  overflow: hidden;
  flex: none;
  font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

.qr-label-artwork--brand::after {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  height: calc(1.4mm * var(--label-scale));
  background: var(--label-accent);
  content: '';
  pointer-events: none;
}

.qr-label-artwork__content {
  position: relative;
  height: 100%;
  text-align: var(--label-align);
}

.qr-label-artwork__custom-layer {
  position: absolute;
  z-index: 3;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
}

.qr-label-artwork--editable .qr-label-artwork__custom-layer {
  min-height: 1.5mm;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.qr-label-artwork--editable .qr-label-artwork__custom-layer:active {
  cursor: grabbing;
}

.qr-label-artwork--editable .qr-label-artwork__custom-layer:hover,
.qr-label-artwork--editable .qr-label-artwork__custom-layer:focus-visible {
  border-radius: 0.8mm;
  outline: 0.1mm dashed var(--label-editor-color);
  outline-offset: 0.1mm;
}

.qr-label-artwork--editable .qr-label-artwork__custom-layer--selected {
  border-radius: 0.35mm;
  outline: 0.1mm solid var(--label-editor-color);
  outline-offset: 0.2mm;
}

.qr-label-artwork__custom-text-row {
  display: flex;
  width: 100%;
  min-width: 0;
}

.qr-label-artwork__custom-text {
  display: block;
  width: 100%;
  min-width: 0;
  flex: 1;
  color: inherit;
  overflow-wrap: anywhere;
}

.qr-label-artwork__associated-image {
  display: block;
  flex: none;
  object-fit: contain;
  -webkit-user-drag: none;
}

.qr-label-artwork__custom-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
}

.qr-label-artwork__custom-layer--divider {
  display: flex;
  align-items: center;
}

.qr-label-artwork__custom-divider {
  display: block;
  width: 100%;
  border-top: 0.2mm dashed var(--label-editor-color);
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
.qr-label-artwork--editable .qr-label-artwork__block:focus-visible {
  border-radius: 0.8mm;
  outline: 0.1mm dashed var(--label-editor-color);
  outline-offset: 0.1mm;
}

.qr-label-artwork--editable .qr-label-artwork__block--selected {
  border-radius: 0.35mm;
  outline: 0.1mm solid var(--label-editor-color);
  outline-offset: 0.2mm;
}

.qr-label-artwork--editable .qr-label-artwork__qr-block:hover,
.qr-label-artwork--editable .qr-label-artwork__qr-block:focus-visible,
.qr-label-artwork--editable
  .qr-label-artwork__qr-block.qr-label-artwork__block--selected {
  outline: none;
}

.qr-label-artwork--editable .qr-label-artwork__qr-block:hover::after,
.qr-label-artwork--editable .qr-label-artwork__qr-block:focus-visible::after,
.qr-label-artwork--editable
  .qr-label-artwork__qr-block.qr-label-artwork__block--selected::after {
  position: absolute;
  inset: calc(7% - 0.2mm);
  border: 0.1mm solid var(--label-editor-color);
  border-radius: 0.35mm;
  content: '';
  pointer-events: none;
}

.qr-label-artwork__resize-handle {
  position: absolute;
  z-index: 5;
  display: none;
  width: 1.4mm;
  height: 1.4mm;
  box-sizing: border-box;
  border: 0.14mm solid var(--label-editor-color);
  background: #ffffff;
  touch-action: none;
}

.qr-label-artwork__custom-layer--selected > .qr-label-artwork__resize-handle,
.qr-label-artwork__block--selected > .qr-label-artwork__resize-handle {
  display: block;
}

.qr-label-artwork__resize-handle--nw {
  top: 0;
  left: 0;
  cursor: nwse-resize;
  transform: translate(-50%, -50%);
}

.qr-label-artwork__resize-handle--n {
  top: 0;
  left: 50%;
  cursor: ns-resize;
  transform: translate(-50%, -50%);
}

.qr-label-artwork__resize-handle--ne {
  top: 0;
  right: 0;
  cursor: nesw-resize;
  transform: translate(50%, -50%);
}

.qr-label-artwork__resize-handle--e {
  top: 50%;
  right: 0;
  cursor: ew-resize;
  transform: translate(50%, -50%);
}

.qr-label-artwork__resize-handle--se {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
  transform: translate(50%, 50%);
}

.qr-label-artwork__resize-handle--s {
  bottom: 0;
  left: 50%;
  cursor: ns-resize;
  transform: translate(-50%, 50%);
}

.qr-label-artwork__resize-handle--sw {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
  transform: translate(-50%, 50%);
}

.qr-label-artwork__resize-handle--w {
  top: 50%;
  left: 0;
  cursor: ew-resize;
  transform: translate(-50%, -50%);
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--nw {
  top: 7%;
  left: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--n {
  top: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--ne {
  top: 7%;
  right: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--e {
  right: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--se {
  right: 7%;
  bottom: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--s {
  bottom: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--sw {
  bottom: 7%;
  left: 7%;
}

.qr-label-artwork__resize-handle--qr.qr-label-artwork__resize-handle--w {
  left: 7%;
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

.qr-label-artwork__image-block {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-label-artwork__image {
  display: block;
  width: var(--label-image-width);
  max-width: 100%;
  max-height: var(--label-image-width);
  object-fit: contain;
  -webkit-user-drag: none;
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
.qr-label-artwork__size {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: calc(1.08mm * var(--label-scale));
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-label-artwork__line {
  opacity: 0.72;
}

.qr-label-artwork__size {
  color: var(--label-accent);
  font-weight: 700;
}

.qr-label-artwork__code {
  display: flex;
  min-height: 1.6mm;
  max-width: calc(100% - 3mm);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 0.2mm;
  text-overflow: ellipsis;
  white-space: nowrap;
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
</style>
