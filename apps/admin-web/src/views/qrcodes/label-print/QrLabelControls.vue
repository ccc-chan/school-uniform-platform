<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { message } from 'ant-design-vue'
import QrLabelIconPicker from './QrLabelIconPicker.vue'
import QrLabelTextSettings from './QrLabelTextSettings.vue'
import type { LabelIcon } from './labelIconCatalog'
import {
  type CustomLabelLayer,
  type CustomLabelLayerType,
  type LabelStyleConfig,
} from './useQrLabelPrint'

const customLayers = defineModel<CustomLabelLayer[]>('customLayers', { required: true })
const labelStyle = defineModel<LabelStyleConfig>('labelStyle', { required: true })

const imageInput = useTemplateRef<HTMLInputElement>('imageInput')
const activeLayerId = shallowRef<string | null>(null)
const editingLayerId = shallowRef<string | null>(null)
const editingName = shallowRef('')
const iconPickerOpen = shallowRef(false)

const activeLayer = computed(
  () => customLayers.value.find((layer) => layer.id === activeLayerId.value) ?? null,
)
const contentValue = computed({
  get: () => activeLayer.value?.type === 'text' ? activeLayer.value.content : '',
  set: (content: string) => {
    if (activeLayer.value?.type === 'text') {
      updateLayer(activeLayer.value.id, { content })
    }
  },
})
const contentPlaceholder = computed(() => {
  if (!activeLayer.value) return '请先新增或选择文字内容'
  if (activeLayer.value.type === 'text') return '请输入文字内容'
  if (activeLayer.value.type === 'image') return '图片没有文字内容'
  return '分割线没有文字内容'
})
watch(customLayers, (layers) => {
  if (activeLayerId.value && !layers.some((layer) => layer.id === activeLayerId.value)) {
    activeLayerId.value = layers[0]?.id ?? null
  }
})

function layerCount(type: CustomLabelLayerType) {
  return customLayers.value.filter((layer) => layer.type === type).length
}

function createLayer(type: CustomLabelLayerType, name: string): CustomLabelLayer {
  const index = customLayers.value.length
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    name,
    content: '',
    imageDataUrl: '',
    alignment: 'left',
    verticalAlignment: 'middle',
    fontFamily: '"Source Han Sans SC", "PingFang SC", sans-serif',
    fontSize: 14,
    fontScale: 100,
    letterSpacing: 0,
    lineHeight: 1.2,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    textColor: labelStyle.value.textColor,
    backgroundColor: 'transparent',
    associatedImageDataUrl: '',
    associatedImageName: '',
    imagePosition: 'before',
    imageSize: 20,
    imageGap: 8,
    imageVerticalAlignment: 'middle',
    x: 50,
    y: Math.min(84, 18 + index * 11),
    width: type === 'image' ? 60 : type === 'text' ? 40 : 80,
    height: type === 'text' ? 4 : 8,
  }
}

function updateLayer(id: string, patch: Partial<CustomLabelLayer>) {
  customLayers.value = customLayers.value.map((layer) =>
    layer.id === id ? { ...layer, ...patch } : layer,
  )
}

function addTextLayer() {
  const layer = createLayer('text', `文字 ${layerCount('text') + 1}`)
  customLayers.value = [...customLayers.value, layer]
  activeLayerId.value = layer.id
}

function chooseImage() {
  imageInput.value?.click()
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 1024 * 1024) {
    message.warning('图片大小不能超过 1 MB')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const fallbackName = `图片 ${layerCount('image') + 1}`
    const layer = createLayer(
      'image',
      file.name.replace(/\.[^.]+$/, '').trim() || fallbackName,
    )
    customLayers.value = [
      ...customLayers.value,
      { ...layer, imageDataUrl: String(reader.result || '') },
    ]
    activeLayerId.value = layer.id
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function addIconLayer(icon: LabelIcon) {
  const layer = createLayer('image', `${icon.categoryLabel} · ${icon.name}`)

  customLayers.value = [
    ...customLayers.value,
    {
      ...layer,
      imageDataUrl: icon.url,
      width: 24,
      height: 8,
    },
  ]
  activeLayerId.value = layer.id
}

function addDividerLayer() {
  const layer = createLayer(
    'divider',
    `分割线 ${layerCount('divider') + 1}`,
  )
  customLayers.value = [...customLayers.value, layer]
  activeLayerId.value = layer.id
}

function removeLayer(layerId: string) {
  customLayers.value = customLayers.value.filter((layer) => layer.id !== layerId)
  if (editingLayerId.value === layerId) cancelLayerName()
}

function startLayerNameEdit(layer: CustomLabelLayer) {
  editingLayerId.value = layer.id
  editingName.value = layer.name
}

function commitLayerName() {
  const name = editingName.value.trim()
  if (editingLayerId.value && name) {
    updateLayer(editingLayerId.value, { name })
  }
  cancelLayerName()
}

function cancelLayerName() {
  editingLayerId.value = null
  editingName.value = ''
}

function replaceLayer(layer: CustomLabelLayer) {
  updateLayer(layer.id, layer)
}
</script>

<template>
  <aside class="label-controls">
    <header class="label-controls__header">
      <h2>标签设置</h2>
      <span>所见即所得</span>
    </header>

    <div class="label-controls__scroll">
      <section class="label-controls__section">
        <label class="label-controls__label" for="label-content">内容</label>
        <a-input
          id="label-content"
          v-model:value="contentValue"
          :maxlength="80"
          :disabled="activeLayer?.type !== 'text'"
          allow-clear
          :placeholder="contentPlaceholder"
        />
      </section>

      <section class="label-controls__section">
        <div class="label-controls__section-heading">
          <h3>自定义内容</h3>
          <span>{{ customLayers.length }}</span>
        </div>

        <div v-if="customLayers.length" class="label-controls__layers">
          <button
            v-for="layer in customLayers"
            :key="layer.id"
            type="button"
            class="label-controls__layer"
            :class="{ 'label-controls__layer--active': activeLayerId === layer.id }"
            @click="activeLayerId = layer.id"
          >
            <span class="label-controls__handle" aria-hidden="true">⠿</span>
            <span class="label-controls__kind" aria-hidden="true">
              {{ layer.type === 'divider' ? '—' : layer.type === 'image' ? '▧' : 'T' }}
            </span>
            <input
              v-if="editingLayerId === layer.id"
              v-model="editingName"
              class="label-controls__rename-input"
              maxlength="30"
              autofocus
              aria-label="自定义内容名称"
              @click.stop
              @dblclick.stop
              @blur="commitLayerName"
              @keydown.enter.prevent="commitLayerName"
              @keydown.esc.prevent="cancelLayerName"
            />
            <strong
              v-else
              title="双击修改名称"
              @dblclick.stop="startLayerNameEdit(layer)"
            >
              {{ layer.name }}
            </strong>
            <span
              class="label-controls__delete"
              role="button"
              :aria-label="`删除${layer.name}`"
              tabindex="0"
              @click.stop="removeLayer(layer.id)"
              @keydown.enter.stop="removeLayer(layer.id)"
            >
              ×
            </span>
          </button>
        </div>
        <div v-else class="label-controls__empty">
          暂无自定义内容，请从下方添加
        </div>

        <div class="label-controls__insert-actions">
          <button type="button" @click="addTextLayer">＋ 文字</button>
          <button type="button" @click="chooseImage">＋ 图片</button>
          <button type="button" @click="iconPickerOpen = true">＋ 图标</button>
          <button type="button" @click="addDividerLayer">＋ 分割线</button>
          <input
            ref="imageInput"
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            @change="handleImageChange"
          />
        </div>
      </section>

      <section v-if="activeLayer" class="label-controls__section label-controls__editor">
        <div class="label-controls__section-heading">
          <h3>{{ activeLayer.name }}</h3>
          <span>当前选中</span>
        </div>

        <QrLabelTextSettings
          v-if="activeLayer.type === 'text'"
          :layer="activeLayer"
          :default-text-color="labelStyle.textColor"
          @update:layer="replaceLayer"
        />

        <p v-else-if="activeLayer.type === 'image'" class="label-controls__note">
          图片或图标可在预览画布中拖动、缩放和调整位置。
        </p>
        <p v-else class="label-controls__note">
          分割线可在预览画布中拖动调整位置。
        </p>
      </section>

    </div>
  </aside>

  <QrLabelIconPicker
    v-model:open="iconPickerOpen"
    @select="addIconLayer"
  />
</template>

<style scoped>
.label-controls {
  display: grid;
  min-width: 0;
  height: 100%;
  grid-template-rows: 49px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: 3px;
  background: #ffffff;
}

.label-controls__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5eaf1;
}

.label-controls__header h2,
.label-controls__section-heading h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 650;
}

.label-controls__header span,
.label-controls__section-heading span {
  color: #8b97aa;
  font-size: 10px;
}

.label-controls__scroll {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dbe2ec transparent;
}

.label-controls__section {
  padding: 13px 14px;
  border-bottom: 1px solid #edf0f4;
}

.label-controls__section:last-child {
  border-bottom: 0;
}

.label-controls__label {
  display: block;
  margin-bottom: 6px;
  color: #313a49;
  font-size: 11px;
  font-weight: 600;
}

.label-controls__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.label-controls__layers {
  overflow: hidden;
  border: 1px solid #e1e6ed;
  border-radius: 4px;
}

.label-controls__layer {
  display: grid;
  width: 100%;
  min-width: 0;
  height: 32px;
  grid-template-columns: 15px 22px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 0;
  border-bottom: 1px solid #edf0f4;
  color: #202938;
  background: #ffffff;
  font-size: 11px;
  text-align: left;
}

.label-controls__layer:last-child {
  border-bottom: 0;
}

.label-controls__layer:hover {
  background: #f6f9ff;
}

.label-controls__layer--active {
  color: #1264d7;
  background: #eaf3ff !important;
  box-shadow: inset 2px 0 #1677ff;
}

.label-controls__handle {
  color: #8b97a8;
  font-size: 13px;
  line-height: 1;
}

.label-controls__kind {
  color: #1b2535;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.label-controls__layer strong {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label-controls__rename-input {
  width: 100%;
  min-width: 0;
  height: 23px;
  padding: 0 5px;
  border: 1px solid #8bbcff;
  border-radius: 2px;
  outline: none;
  color: #172033;
  background: #ffffff;
  font-size: 11px;
}

.label-controls__delete {
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: #8b97a8;
  font-size: 16px;
  line-height: 1;
}

.label-controls__delete:hover {
  color: #dc2626;
  background: #fff1f0;
}

.label-controls__empty {
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dce3ec;
  border-radius: 4px;
  color: #98a3b3;
  background: #fafbfd;
  font-size: 10px;
}

.label-controls__insert-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 9px;
}

.label-controls__insert-actions button {
  border: 1px solid #dfe5ee;
  border-radius: 3px;
  color: #3e4959;
  background: #ffffff;
}

.label-controls__insert-actions button {
  height: 28px;
  font-size: 10px;
}

.label-controls__insert-actions button:hover {
  border-color: #8dbdff;
  color: #1677ff;
  background: #f4f8ff;
}

.label-controls__note {
  margin: 0;
  color: #6b778a;
  font-size: 10px;
  line-height: 1.6;
}

.label-controls :deep(.ant-input),
.label-controls :deep(.ant-select-selector),
.label-controls :deep(.ant-input-number) {
  border-radius: 3px !important;
  font-size: 11px;
}

.label-controls button:focus-visible,
.label-controls__delete:focus-visible {
  outline: 2px solid rgb(22 119 255 / 35%);
  outline-offset: -2px;
}

@media (max-width: 1180px) {
  .label-controls {
    height: auto;
  }

  .label-controls__scroll {
    overflow: visible;
  }
}
</style>
