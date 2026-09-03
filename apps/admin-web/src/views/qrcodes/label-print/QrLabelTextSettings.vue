<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { message } from 'ant-design-vue'
import type {
  CustomLabelLayer,
  LabelAlignment,
  LabelImagePosition,
  LabelVerticalAlignment,
} from './useQrLabelPrint'

const props = withDefaults(
  defineProps<{
    layer: CustomLabelLayer
    defaultTextColor: string
    showAssociatedImage?: boolean
  }>(),
  {
    showAssociatedImage: true,
  },
)

const emit = defineEmits<{
  'update:layer': [layer: CustomLabelLayer]
}>()

const imageInput = useTemplateRef<HTMLInputElement>('associatedImageInput')

const fontOptions = [
  {
    label: '思源黑体',
    value: '"Source Han Sans SC", "PingFang SC", sans-serif',
  },
  { label: '苹方', value: '"PingFang SC", sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '宋体', value: 'SimSun, serif' },
]

const horizontalOptions = [
  { label: '左对齐', value: 'left' },
  { label: '水平居中', value: 'center' },
  { label: '右对齐', value: 'right' },
]

const verticalOptions = [
  { label: '顶部', value: 'top' },
  { label: '垂直居中', value: 'middle' },
  { label: '底部', value: 'bottom' },
]

function updateLayer(patch: Partial<CustomLabelLayer>) {
  emit('update:layer', { ...props.layer, ...patch })
}

function updateAlignment(value: string | number) {
  updateLayer({ alignment: String(value) as LabelAlignment })
}

function updateVerticalAlignment(value: string | number) {
  updateLayer({
    verticalAlignment: String(value) as LabelVerticalAlignment,
  })
}

function updateImagePosition(value: string | number) {
  updateLayer({ imagePosition: String(value) as LabelImagePosition })
}

function updateImageVerticalAlignment(value: string | number) {
  updateLayer({
    imageVerticalAlignment: String(value) as LabelVerticalAlignment,
  })
}

function selectAssociatedImage() {
  imageInput.value?.click()
}

function handleAssociatedImage(event: Event) {
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
    updateLayer({
      associatedImageDataUrl: String(reader.result || ''),
      associatedImageName: file.name,
    })
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeAssociatedImage() {
  updateLayer({
    associatedImageDataUrl: '',
    associatedImageName: '',
  })
}

function updateColor(key: 'textColor' | 'backgroundColor', event: Event) {
  updateLayer({ [key]: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="text-settings">
    <section v-if="showAssociatedImage" class="text-settings__group">
      <div class="text-settings__title">
        <strong>关联图片</strong>
        <span>可选</span>
      </div>

      <div class="text-settings__image-card">
        <div class="text-settings__image-preview">
          <img
            v-if="layer.associatedImageDataUrl"
            :src="layer.associatedImageDataUrl"
            alt="关联图片预览"
          />
          <span v-else aria-hidden="true">▧</span>
        </div>
        <span class="text-settings__image-name">
          {{ layer.associatedImageName || '尚未选择图片' }}
        </span>
        <button type="button" @click="selectAssociatedImage">选择图片</button>
        <button
          v-if="layer.associatedImageDataUrl"
          type="button"
          class="text-settings__danger"
          @click="removeAssociatedImage"
        >
          删除
        </button>
        <input
          ref="associatedImageInput"
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          @change="handleAssociatedImage"
        />
      </div>

      <template v-if="layer.associatedImageDataUrl">
        <label class="text-settings__label">图片位置</label>
        <a-segmented
          :value="layer.imagePosition || 'before'"
          :options="[
            { label: '文字前', value: 'before' },
            { label: '文字后', value: 'after' },
          ]"
          block
          @update:value="updateImagePosition"
        />

        <div class="text-settings__number-grid">
          <label>
            <span>图片大小</span>
            <a-input-number
              :value="layer.imageSize ?? 20"
              :min="8"
              :max="96"
              addon-after="px"
              @update:value="updateLayer({ imageSize: Number($event) })"
            />
          </label>
          <label>
            <span>图文间距</span>
            <a-input-number
              :value="layer.imageGap ?? 8"
              :min="0"
              :max="40"
              addon-after="px"
              @update:value="updateLayer({ imageGap: Number($event) })"
            />
          </label>
        </div>

        <label class="text-settings__label">图文垂直对齐</label>
        <a-segmented
          :value="layer.imageVerticalAlignment || 'middle'"
          :options="verticalOptions"
          block
          @update:value="updateImageVerticalAlignment"
        />
      </template>
    </section>

    <section class="text-settings__group">
      <div class="text-settings__title">
        <strong>文字样式</strong>
      </div>

      <div class="text-settings__font-grid">
        <label>
          <span>字体</span>
          <a-select
            :value="layer.fontFamily"
            :options="fontOptions"
            @update:value="updateLayer({ fontFamily: String($event) })"
          />
        </label>
        <label>
          <span>字号</span>
          <a-input-number
            :value="layer.fontSize ?? 14"
            :min="6"
            :max="72"
            addon-after="px"
            @update:value="updateLayer({ fontSize: Number($event) })"
          />
        </label>
      </div>

      <label class="text-settings__label">水平对齐</label>
      <a-segmented
        :value="layer.alignment"
        :options="horizontalOptions"
        block
        @update:value="updateAlignment"
      />

      <label class="text-settings__label">垂直对齐</label>
      <a-segmented
        :value="layer.verticalAlignment || 'middle'"
        :options="verticalOptions"
        block
        @update:value="updateVerticalAlignment"
      />

      <div class="text-settings__metric-grid">
        <label>
          <span>字距</span>
          <a-input-number
            :value="layer.letterSpacing ?? 0"
            :min="-5"
            :max="30"
            addon-after="px"
            @update:value="updateLayer({ letterSpacing: Number($event) })"
          />
        </label>
        <label>
          <span>行距</span>
          <a-input-number
            :value="layer.lineHeight ?? 1.2"
            :min="0.8"
            :max="3"
            :step="0.1"
            @update:value="updateLayer({ lineHeight: Number($event) })"
          />
        </label>
        <label>
          <span>缩放</span>
          <a-input-number
            :value="layer.fontScale ?? 100"
            :min="50"
            :max="200"
            addon-after="%"
            @update:value="updateLayer({ fontScale: Number($event) })"
          />
        </label>
      </div>

      <div class="text-settings__toolbar">
        <button
          type="button"
          aria-label="加粗"
          :aria-pressed="layer.bold"
          :class="{ 'text-settings__tool--active': layer.bold }"
          @click="updateLayer({ bold: !layer.bold })"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="斜体"
          :aria-pressed="layer.italic"
          :class="{ 'text-settings__tool--active': layer.italic }"
          @click="updateLayer({ italic: !layer.italic })"
        >
          <span aria-hidden="true">/</span>
        </button>
        <button
          type="button"
          aria-label="下划线"
          :aria-pressed="layer.underline"
          :class="{ 'text-settings__tool--active': layer.underline }"
          @click="updateLayer({ underline: !layer.underline })"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          aria-label="删除线"
          :aria-pressed="layer.strikethrough"
          :class="{ 'text-settings__tool--active': layer.strikethrough }"
          @click="updateLayer({ strikethrough: !layer.strikethrough })"
        >
          <s>S</s>
        </button>

        <label class="text-settings__color" title="字体颜色">
          <input
            type="color"
            :value="layer.textColor || defaultTextColor"
            aria-label="当前内容文字颜色"
            @input="updateColor('textColor', $event)"
          />
        </label>

        <label class="text-settings__color" title="背景颜色">
          <input
            type="color"
            :value="
              layer.backgroundColor === 'transparent'
                ? '#ffffff'
                : layer.backgroundColor
            "
            aria-label="当前内容背景颜色"
            @input="updateColor('backgroundColor', $event)"
          />
        </label>

        <button
          type="button"
          aria-label="清除背景颜色"
          title="清除背景颜色"
          @click="updateLayer({ backgroundColor: 'transparent' })"
        >
          ∅
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.text-settings {
  display: grid;
  gap: 14px;
}

.text-settings__group {
  display: grid;
  gap: 8px;
}

.text-settings__group + .text-settings__group {
  padding-top: 13px;
  border-top: 1px solid #edf0f4;
}

.text-settings__title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #172033;
  font-size: 11px;
}

.text-settings__title strong {
  font-weight: 650;
}

.text-settings__title span {
  color: #8b97aa;
  font-size: 9px;
}

.text-settings__label,
.text-settings__font-grid label,
.text-settings__number-grid label,
.text-settings__metric-grid label {
  display: grid;
  gap: 5px;
  color: #485466;
  font-size: 10px;
}

.text-settings__image-card {
  display: grid;
  min-width: 0;
  grid-template-columns: 30px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid #e1e6ed;
  border-radius: 4px;
  background: #ffffff;
}

.text-settings__image-preview {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #edf0f4;
  border-radius: 3px;
  color: #98a3b3;
  background: #f8fafc;
}

.text-settings__image-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.text-settings__image-name {
  overflow: hidden;
  color: #394454;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-settings__image-card button,
.text-settings__toolbar button {
  border: 1px solid #dfe5ee;
  border-radius: 3px;
  color: #3e4959;
  background: #ffffff;
}

.text-settings__image-card button {
  height: 25px;
  padding: 0 7px;
  font-size: 9px;
}

.text-settings__image-card .text-settings__danger {
  border-color: transparent;
  color: #e5484d;
}

.text-settings__font-grid,
.text-settings__number-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.text-settings__metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.text-settings__toolbar {
  display: grid;
  grid-template-columns: repeat(7, 31px);
  gap: 5px;
  margin-top: 2px;
}

.text-settings__toolbar button,
.text-settings__color {
  display: flex;
  width: 31px;
  height: 28px;
  align-items: center;
  justify-content: center;
}

.text-settings__toolbar button:hover,
.text-settings__toolbar .text-settings__tool--active {
  border-color: #1677ff;
  color: #1677ff;
  background: #eaf3ff;
}

.text-settings__color {
  overflow: hidden;
  border: 1px solid #dfe5ee;
  border-radius: 3px;
}

.text-settings__color input {
  width: 40px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.text-settings :deep(.ant-segmented) {
  padding: 2px;
  border: 1px solid #e1e6ed;
  border-radius: 3px;
  background: #f8fafc;
  font-size: 10px;
}

.text-settings :deep(.ant-select),
.text-settings :deep(.ant-input-number) {
  width: 100%;
}

.text-settings :deep(.ant-select-selector),
.text-settings :deep(.ant-input-number),
.text-settings :deep(.ant-input-number-group-addon) {
  border-radius: 3px !important;
  font-size: 10px;
}

.text-settings button:focus-visible,
.text-settings input:focus-visible {
  outline: 2px solid rgb(22 119 255 / 35%);
  outline-offset: 1px;
}
</style>
