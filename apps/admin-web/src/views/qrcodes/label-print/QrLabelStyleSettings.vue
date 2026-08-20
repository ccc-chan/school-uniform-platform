<script setup lang="ts">
import {
  LABEL_STYLE_PRESETS,
  type LabelAlignment,
  type LabelBorderStyle,
  type LabelStyleConfig,
} from './useQrLabelPrint'

const labelStyle = defineModel<LabelStyleConfig>('labelStyle', { required: true })

const alignmentOptions = [
  { label: '左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右', value: 'right' },
]
const borderOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '无边框', value: 'none' },
]

function patchStyle<K extends keyof LabelStyleConfig>(
  key: K,
  value: LabelStyleConfig[K],
) {
  labelStyle.value = { ...labelStyle.value, [key]: value }
}

function applyPreset(style: LabelStyleConfig) {
  labelStyle.value = { ...style }
}

function resetStyle() {
  applyPreset(LABEL_STYLE_PRESETS[0].style)
}

function updateAlignment(value: unknown) {
  if (['left', 'center', 'right'].includes(String(value))) {
    patchStyle('alignment', String(value) as LabelAlignment)
  }
}

function updateBorderStyle(value: unknown) {
  if (['solid', 'dashed', 'none'].includes(String(value))) {
    patchStyle('borderStyle', String(value) as LabelBorderStyle)
  }
}

function updateScale(key: 'fontScale' | 'qrScale', value: unknown) {
  const number = Number(value)
  if (Number.isFinite(number)) patchStyle(key, number)
}

function updateColor(
  key: 'textColor' | 'accentColor' | 'backgroundColor',
  event: Event,
) {
  const input = event.target as HTMLInputElement | null
  if (input?.value) patchStyle(key, input.value)
}
</script>

<template>
  <div class="style-settings">
    <section class="style-settings__section">
      <header class="style-settings__heading">
        <div>
          <h3>样式模板</h3>
          <span>选择后仍可继续微调</span>
        </div>
        <button type="button" class="style-settings__reset" @click="resetStyle">
          恢复默认
        </button>
      </header>

      <div class="style-settings__templates">
        <button
          v-for="preset in LABEL_STYLE_PRESETS"
          :key="preset.key"
          type="button"
          class="style-settings__template"
          :class="{
            'style-settings__template--active':
              labelStyle.presetKey === preset.key,
          }"
          :title="preset.description"
          @click="applyPreset(preset.style)"
        >
          <span
            class="style-settings__template-swatch"
            :class="`style-settings__template-swatch--${preset.key}`"
            :style="{ '--swatch-accent': preset.style.accentColor }"
            aria-hidden="true"
          />
          <strong>{{ preset.label }}</strong>
        </button>
      </div>
    </section>

    <section class="style-settings__section">
      <header class="style-settings__heading">
        <div>
          <h3>排版调整</h3>
          <span>预览同步生效</span>
        </div>
      </header>

      <div class="style-settings__grid">
        <label>内容对齐</label>
        <a-segmented
          :value="labelStyle.alignment"
          :options="alignmentOptions"
          block
          @update:value="updateAlignment"
        />

        <label>文字大小</label>
        <div class="style-settings__slider-row">
          <a-slider
            :value="labelStyle.fontScale"
            :min="80"
            :max="140"
            :step="5"
            @update:value="updateScale('fontScale', $event)"
          />
          <span>{{ labelStyle.fontScale }}%</span>
        </div>

        <label>二维码大小</label>
        <div class="style-settings__slider-row">
          <a-slider
            :value="labelStyle.qrScale"
            :min="70"
            :max="140"
            :step="5"
            @update:value="updateScale('qrScale', $event)"
          />
          <span>{{ labelStyle.qrScale }}%</span>
        </div>

        <label>边框样式</label>
        <a-select
          :value="labelStyle.borderStyle"
          :options="borderOptions"
          @update:value="updateBorderStyle"
        />
      </div>
    </section>

    <section class="style-settings__section">
      <header class="style-settings__heading">
        <div>
          <h3>标签配色</h3>
          <span>点击色块选择颜色</span>
        </div>
      </header>
      <div class="style-settings__colors">
        <label>
          <span>文字色</span>
          <input
            type="color"
            :value="labelStyle.textColor"
            aria-label="标签文字颜色"
            @input="updateColor('textColor', $event)"
          />
        </label>
        <label>
          <span>强调色</span>
          <input
            type="color"
            :value="labelStyle.accentColor"
            aria-label="标签强调颜色"
            @input="updateColor('accentColor', $event)"
          />
        </label>
        <label>
          <span>背景色</span>
          <input
            type="color"
            :value="labelStyle.backgroundColor"
            aria-label="标签背景颜色"
            @input="updateColor('backgroundColor', $event)"
          />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.style-settings {
  padding: 4px 18px 18px;
}

.style-settings__section {
  padding: 16px 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.style-settings__section:last-child {
  padding-bottom: 4px;
  border-bottom: 0;
}

.style-settings__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.style-settings__heading div {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.style-settings__heading h3 {
  margin: 0;
  color: #172033;
  font-size: 13px;
}

.style-settings__heading span {
  overflow: hidden;
  color: #94a3b8;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-settings__reset {
  flex: none;
  padding: 3px 0;
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 10px;
  cursor: pointer;
}

.style-settings__reset:hover {
  color: #2563eb;
}

.style-settings__templates {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.style-settings__template {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 7px;
  padding: 9px 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  color: #475569;
  background: #ffffff;
  transition: 0.18s ease;
}

.style-settings__template:hover,
.style-settings__template--active {
  border-color: #2f6fed;
  color: #2563eb;
  background: #f7faff;
  box-shadow: inset 0 0 0 1px #2f6fed;
}

.style-settings__template:focus-visible,
.style-settings__reset:focus-visible {
  outline: 3px solid rgb(59 130 246 / 24%);
  outline-offset: 2px;
}

.style-settings__template strong {
  overflow: hidden;
  max-width: 100%;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-settings__template-swatch {
  position: relative;
  width: 25px;
  height: 32px;
  flex: none;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.style-settings__template-swatch::before,
.style-settings__template-swatch::after {
  position: absolute;
  right: 5px;
  left: 5px;
  background: #64748b;
  content: "";
}

.style-settings__template-swatch::before {
  top: 9px;
  height: 2px;
  box-shadow: 0 4px #cbd5e1;
}

.style-settings__template-swatch::after {
  bottom: 4px;
  width: 6px;
  height: 6px;
  margin: auto;
  background: var(--swatch-accent);
}

.style-settings__template-swatch--minimal {
  border-color: transparent;
}

.style-settings__template-swatch--minimal::before,
.style-settings__template-swatch--minimal::after {
  right: 8px;
  left: 2px;
  margin: 0;
}

.style-settings__template-swatch--brand {
  background: #f8fbff;
}

.style-settings__template-swatch--brand::before {
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: var(--swatch-accent);
  box-shadow: 5px 10px #64748b, 5px 14px #cbd5e1;
}

.style-settings__grid {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  align-items: center;
  gap: 11px 9px;
}

.style-settings__grid > label,
.style-settings__colors label span {
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

.style-settings__slider-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  align-items: center;
  gap: 7px;
}

.style-settings__slider-row :deep(.ant-slider) {
  margin: 6px;
}

.style-settings__slider-row > span {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  text-align: right;
}

.style-settings__colors {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.style-settings__colors label {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6px 7px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.style-settings__colors input {
  width: 23px;
  height: 23px;
  flex: none;
  padding: 2px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}
</style>
