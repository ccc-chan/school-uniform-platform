<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue'
import { message } from 'ant-design-vue'
import type { QrLabelBatch, QrLabelItem } from '@/api/qrcodes'
import QrLabelArtwork from './QrLabelArtwork.vue'
import {
  LABEL_SIZE_PRESETS,
  LABEL_STYLE_PRESETS,
  createDefaultLabelLayout,
  type CustomLabelLayer,
  type LabelField,
  type LabelLayout,
  type LabelStyleConfig,
} from './useQrLabelPrint'

export interface LabelTemplateSnapshot {
  id: string
  name: string
  category: string
  sizeKey: string
  width: number
  height: number
  selectedFields: LabelField[]
  imageDataUrl: string
  customLayers: CustomLabelLayer[]
  style: LabelStyleConfig
  layout: LabelLayout
  updatedAt: string
}

const props = defineProps<{
  snapshot: Omit<
    LabelTemplateSnapshot,
    'id' | 'name' | 'category' | 'updatedAt'
  >
  currentLabelName: string
}>()
const emit = defineEmits<{
  applyTemplate: [template: LabelTemplateSnapshot]
}>()

const storageKey = 'school-uniform-label-templates-v2'
localStorage.removeItem('school-uniform-label-templates-v1')
const saveOpen = shallowRef(false)
const createOpen = shallowRef(false)
const dialogIntent = shallowRef<'create' | 'open'>('create')
const creationMode = shallowRef<'blank' | 'template'>('blank')
const selectedTemplateId = shallowRef('')
const templateQuery = shallowRef('')
const createLabelName = shallowRef('')
const createSizeKey = shallowRef('30x90')
const createWidth = shallowRef(30)
const createHeight = shallowRef(90)
const customTemplates = ref<LabelTemplateSnapshot[]>(readStoredTemplates())
const saveForm = reactive({
  name: '',
  defaultTemplate: false,
})

const templatePreviewBatch: QrLabelBatch = {
  batchNo: 'PREVIEW',
  productionDate: null,
  productCode: 'PREVIEW',
  productName: '产品名称',
  style: '款号',
  fabricInfo: '面料',
  labelCount: 1,
}
const templatePreviewItem: QrLabelItem = {
  id: 0,
  code: 'PREVIEW',
  productSku: 'PREVIEW',
  size: '尺码',
}

const allTemplates = computed(() => customTemplates.value)
const filteredTemplates = computed(() => {
  const query = templateQuery.value.trim().toLocaleLowerCase('zh-CN')
  if (!query) return allTemplates.value
  return allTemplates.value.filter((template) =>
    template.name.toLocaleLowerCase('zh-CN').includes(query),
  )
})
const selectedTemplate = computed(
  () =>
    allTemplates.value.find(
      (template) => template.id === selectedTemplateId.value,
    ) ?? allTemplates.value[0],
)
const createSizePresets = LABEL_SIZE_PRESETS.filter((preset) => !preset.custom)
const createPaperStyle = computed(() => {
  const millimeterToPixel = 3.7795275591
  const rawWidth = Math.max(25, createWidth.value) * millimeterToPixel
  const rawHeight = Math.max(25, createHeight.value) * millimeterToPixel
  const scale = Math.min(135 / rawWidth, 315 / rawHeight)

  return {
    width: `${Math.round(rawWidth * scale)}px`,
    height: `${Math.round(rawHeight * scale)}px`,
  }
})
const previewDimensions = computed(() => ({
  width: createWidth.value,
  height: createHeight.value,
}))
const previewScale = computed(() => {
  const millimeterToPixel = 3.7795275591
  const rawWidth = Math.max(25, createWidth.value) * millimeterToPixel
  const rawHeight = Math.max(25, createHeight.value) * millimeterToPixel
  return Math.min(135 / rawWidth, 315 / rawHeight)
})
const createArtworkStyle = computed(() => ({
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'left top',
}))

function readStoredTemplates() {
  try {
    const value = localStorage.getItem(storageKey)
    const templates = value
      ? (JSON.parse(value) as Array<
          LabelTemplateSnapshot & {
            imageDataUrl?: string
            customLayers?: CustomLabelLayer[]
          }
        >)
      : []
    return templates.map((template) => ({
      ...template,
      imageDataUrl: template.imageDataUrl ?? '',
      customLayers: template.customLayers ?? [],
      layout: {
        ...createDefaultLabelLayout(),
        ...template.layout,
      },
    }))
  } catch {
    return []
  }
}

function persistTemplates() {
  localStorage.setItem(storageKey, JSON.stringify(customTemplates.value))
}

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function openSave() {
  saveForm.name = props.currentLabelName
  saveForm.defaultTemplate = false
  saveOpen.value = true
}

function prepareLabelDialog() {
  createLabelName.value = props.currentLabelName.trim() || '未命名标签'
  templateQuery.value = ''
  selectedTemplateId.value = customTemplates.value[0]?.id ?? ''
}

function openCreate() {
  prepareLabelDialog()
  dialogIntent.value = 'create'
  creationMode.value = 'blank'
  applyCreateSize(props.snapshot)
  createOpen.value = true
}

function openTemplates() {
  prepareLabelDialog()
  dialogIntent.value = 'open'
  creationMode.value = 'template'
  applyCreateSize(selectedTemplate.value ?? props.snapshot)
  createOpen.value = true
}

function applyCreateSize(size: {
  sizeKey: string
  width: number
  height: number
}) {
  createSizeKey.value = size.sizeKey
  createWidth.value = size.width
  createHeight.value = size.height
}

function selectCreateSize(sizeKey: string) {
  const preset = createSizePresets.find((item) => item.key === sizeKey)
  if (!preset) return

  applyCreateSize({
    sizeKey: preset.key,
    width: preset.width,
    height: preset.height,
  })
}

function updateCreateDimension(key: 'width' | 'height', value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return

  createSizeKey.value = 'custom'
  if (key === 'width') {
    createWidth.value = number
  } else {
    createHeight.value = number
  }
}

function selectCreationMode(mode: 'blank' | 'template') {
  creationMode.value = mode
  if (mode === 'template' && selectedTemplate.value) {
    applyCreateSize(selectedTemplate.value)
  } else {
    applyCreateSize(props.snapshot)
  }
}

function selectCreateTemplate(template: LabelTemplateSnapshot) {
  selectedTemplateId.value = template.id
  applyCreateSize(template)
}

function deleteTemplate(templateId: string) {
  const deletingSelected = selectedTemplateId.value === templateId

  customTemplates.value = customTemplates.value.filter(
    (template) => template.id !== templateId,
  )
  persistTemplates()

  if (deletingSelected) {
    const nextTemplate = customTemplates.value[0]
    selectedTemplateId.value = nextTemplate?.id ?? ''

    if (nextTemplate && creationMode.value === 'template') {
      applyCreateSize(nextTemplate)
    } else if (!nextTemplate) {
      if (dialogIntent.value === 'create') {
        creationMode.value = 'blank'
      }
      applyCreateSize(props.snapshot)
    }
  }

  message.success('模板已删除')
}

function saveTemplate() {
  const name = saveForm.name.trim()
  if (!name) {
    message.warning('请输入模板名称')
    return
  }

  const template: LabelTemplateSnapshot = {
    ...cloneSnapshot(props.snapshot),
    id: `custom-${Date.now()}`,
    name,
    category: '追溯标签',
    updatedAt: new Date().toISOString().slice(0, 10),
  }
  customTemplates.value = [template, ...customTemplates.value]
  persistTemplates()
  selectedTemplateId.value = template.id
  saveOpen.value = false
  message.success('模板已保存')
}

function createLabel() {
  const name = createLabelName.value.trim() || '未命名标签'
  const selectedSize = {
    sizeKey: createSizeKey.value,
    width: createWidth.value,
    height: createHeight.value,
  }

  if (creationMode.value === 'blank') {
    emit('applyTemplate', {
      ...cloneSnapshot(props.snapshot),
      ...selectedSize,
      id: `blank-${Date.now()}`,
      name,
      category: '空白标签',
      selectedFields: [],
      imageDataUrl: '',
      customLayers: [],
      style: { ...LABEL_STYLE_PRESETS[0].style },
      layout: createDefaultLabelLayout(),
      updatedAt: new Date().toISOString().slice(0, 10),
    })
  } else if (selectedTemplate.value) {
    emit('applyTemplate', {
      ...cloneSnapshot(selectedTemplate.value),
      ...selectedSize,
      name,
    })
  } else {
    message.warning('暂无可用模板，请选择空白标签')
    return
  }
  createOpen.value = false
  message.success('新标签已创建，可继续编辑内容和样式')
}

function openSelectedTemplate() {
  if (!selectedTemplate.value) {
    message.warning('暂无可用模板，请先保存标签')
    return
  }

  emit('applyTemplate', cloneSnapshot(selectedTemplate.value))
  createOpen.value = false
  message.success('模板已打开，可继续编辑内容和样式')
}

defineExpose({ openSave, openCreate, openTemplates })
</script>

<template>
  <a-modal
    v-model:open="saveOpen"
    :width="490"
    :footer="null"
    centered
    wrap-class-name="label-template-dialog"
  >
    <div class="template-dialog__title">
      <h2>保存为模板</h2>
      <p>保存当前标签的尺寸、内容和样式，供下次新建标签时使用</p>
    </div>

    <div class="template-dialog__form">
      <label for="template-name">模板名称</label>
      <a-input
        id="template-name"
        v-model:value="saveForm.name"
        :maxlength="40"
      />

      <a-checkbox v-model:checked="saveForm.defaultTemplate"
        >设为常用模板</a-checkbox
      >

      <p class="template-dialog__info">
        <span aria-hidden="true">ⓘ</span>
        将保存标签尺寸、内容层级、图片关联与文字样式，不包含当前生产批次数据。
      </p>
    </div>

    <div class="template-dialog__footer">
      <a-button @click="saveOpen = false">取消</a-button>
      <a-button type="primary" @click="saveTemplate">保存模板</a-button>
    </div>
  </a-modal>

  <a-modal
    v-model:open="createOpen"
    :width="790"
    :footer="null"
    centered
    wrap-class-name="label-template-dialog label-template-dialog--create"
  >
    <div class="template-dialog__title">
      <h2>{{ dialogIntent === 'open' ? '打开模板' : '新建标签' }}</h2>
      <p>
        {{
          dialogIntent === 'open'
            ? '选择我的模板并应用到当前标签'
            : '选择模板快速创建，创建后仍可继续编辑内容和样式'
        }}
      </p>
    </div>

    <div class="template-create">
      <div class="template-create__main">
        <template v-if="dialogIntent === 'create'">
          <label class="template-create__label" for="create-label-name">
            标签名称
          </label>
          <a-input
            id="create-label-name"
            v-model:value="createLabelName"
            :maxlength="40"
          />

          <label class="template-create__label">创建方式</label>
          <div class="template-create__modes">
            <button
              type="button"
              :class="{
                'template-create__mode--active': creationMode === 'blank',
              }"
              @click="selectCreationMode('blank')"
            >
              <span aria-hidden="true">□</span>
              <strong>空白标签</strong>
              <small>从空白画布开始</small>
            </button>
            <button
              type="button"
              :class="{
                'template-create__mode--active': creationMode === 'template',
              }"
              :disabled="!customTemplates.length"
              @click="selectCreationMode('template')"
            >
              <span aria-hidden="true">▦</span>
              <strong>使用我的模板</strong>
              <small>{{
                customTemplates.length ? '选择已保存模板' : '暂无已保存模板'
              }}</small>
            </button>
          </div>

          <section class="template-create__size">
            <label class="template-create__label">标签尺寸</label>

            <div class="template-create__size-fields">
              <label>
                <span>宽度</span>
                <span class="template-create__size-input">
                  <a-input-number
                    :value="createWidth"
                    :min="25"
                    :max="500"
                    @update:value="updateCreateDimension('width', $event)"
                  />
                  <i>mm</i>
                </span>
              </label>

              <label>
                <span>高度</span>
                <span class="template-create__size-input">
                  <a-input-number
                    :value="createHeight"
                    :min="25"
                    :max="500"
                    @update:value="updateCreateDimension('height', $event)"
                  />
                  <i>mm</i>
                </span>
              </label>
            </div>

            <div class="template-create__size-presets">
              <button
                v-for="preset in createSizePresets"
                :key="preset.key"
                type="button"
                :class="{
                  'template-create__size-preset--active':
                    createSizeKey === preset.key,
                }"
                @click="selectCreateSize(preset.key)"
              >
                {{ preset.width }} × {{ preset.height }} mm
              </button>
            </div>
          </section>
        </template>

        <template v-if="dialogIntent === 'open' || creationMode === 'template'">
          <label class="template-create__label">我的模板</label>
          <div class="template-create__search">
            <a-input
              v-model:value="templateQuery"
              allow-clear
              placeholder="请输入模板名称"
            />
            <a-button type="primary">查询</a-button>
            <a-button @click="templateQuery = ''">重置</a-button>
          </div>

          <div class="template-create__grid">
            <div
              v-for="template in filteredTemplates.slice(0, 4)"
              :key="template.id"
              class="template-card-shell"
            >
              <button
                type="button"
                class="template-card"
                :class="{
                  'template-card--active': selectedTemplateId === template.id,
                }"
                @click="selectCreateTemplate(template)"
              >
                <span class="template-card__mini">
                  <i />
                  <b>{{
                    template.width > template.height ? '横版' : '竖版'
                  }}</b>
                  <em />
                </span>
                <span class="template-card__copy">
                  <strong>{{ template.name }}</strong>
                  <small
                    >{{ template.width }} × {{ template.height }} mm ·
                    {{
                      template.width > template.height ? '横版' : '竖版'
                    }}</small
                  >
                  <small>更新于 {{ template.updatedAt }}</small>
                </span>
                <span
                  v-if="selectedTemplateId === template.id"
                  class="template-card__check"
                  >✓</span
                >
              </button>
              <a-popconfirm
                title="确认删除这个模板吗？"
                description="删除后无法恢复。"
                ok-text="确认删除"
                cancel-text="取消"
                placement="topRight"
                @confirm="deleteTemplate(template.id)"
              >
                <button
                  type="button"
                  class="template-card__delete"
                  :aria-label="`删除模板 ${template.name}`"
                  title="删除模板"
                  @click.stop
                >
                  ×
                </button>
              </a-popconfirm>
            </div>
            <p v-if="!filteredTemplates.length" class="template-create__empty">
              暂无匹配模板
            </p>
          </div>
        </template>
      </div>

      <aside class="template-create__preview">
        <h3>模板预览</h3>
        <div
          class="template-create__paper"
          :class="{ 'template-create__paper--blank': creationMode === 'blank' }"
          :style="createPaperStyle"
        >
          <div
            v-if="creationMode === 'template' && selectedTemplate"
            class="template-create__artwork"
            :style="createArtworkStyle"
          >
            <QrLabelArtwork
              :batch="templatePreviewBatch"
              :item="templatePreviewItem"
              company-name="公司名称"
              :selected-fields="selectedTemplate.selectedFields"
              :dimensions="previewDimensions"
              qr-data-url=""
              :label-image-url="selectedTemplate.imageDataUrl"
              :label-style="selectedTemplate.style"
              :layout="selectedTemplate.layout"
              :custom-layers="selectedTemplate.customLayers"
            />
          </div>
          <span v-else class="template-create__blank-tip">空白画布</span>
        </div>
        <template v-if="creationMode === 'template' && selectedTemplate">
          <strong class="template-create__preview-name">{{
            selectedTemplate.name
          }}</strong>
          <span
            >{{ createWidth }} × {{ createHeight }} mm ·
            {{ createWidth > createHeight ? '横版' : '竖版' }}</span
          >
          <span>可继续调整模板尺寸</span>
        </template>
        <template v-else>
          <strong class="template-create__preview-name">空白标签</strong>
          <span
            >{{ createWidth }} × {{ createHeight }} mm ·
            {{ createWidth > createHeight ? '横版' : '竖版' }}</span
          >
          <span>创建后可按需添加文字、图片和分割线</span>
        </template>
      </aside>
    </div>

    <div class="template-dialog__footer template-dialog__footer--create">
      <span>
        ⓘ
        {{
          dialogIntent === 'open'
            ? '打开后可继续编辑，不会修改原模板'
            : '创建后不会修改原模板'
        }}
      </span>
      <div>
        <a-button @click="createOpen = false">取消</a-button>
        <a-button
          type="primary"
          @click="dialogIntent === 'open' ? openSelectedTemplate() : createLabel()"
        >
          {{
            dialogIntent === 'open'
              ? '打开此模板'
              : creationMode === 'blank'
                ? '创建空白标签'
                : '使用此模板并创建'
          }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.template-dialog__title {
  margin: -3px 0 20px;
  padding-right: 28px;
}

.template-dialog__title h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 650;
}

.template-dialog__title p {
  margin: 4px 0 0;
  color: #758197;
  font-size: 11px;
}

.template-dialog__form {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: 12px 10px;
}

.template-dialog__form > label {
  color: #293343;
  font-size: 11px;
  font-weight: 600;
}

.template-dialog__form :deep(.ant-checkbox-wrapper),
.template-dialog__info {
  grid-column: 1 / -1;
}

.template-dialog__info {
  display: flex;
  gap: 8px;
  margin: 2px 0 0;
  padding: 10px 12px;
  border: 1px solid #d7e7ff;
  border-radius: 3px;
  color: #586b84;
  background: #f3f7ff;
  font-size: 10px;
  line-height: 1.55;
}

.template-dialog__info span {
  color: #1677ff;
}

.template-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 20px -24px -10px;
  padding: 13px 24px 0;
  border-top: 1px solid #e8ecf2;
}

.template-dialog__footer :deep(.ant-btn) {
  min-width: 100px;
  border-radius: 3px;
}

.template-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 225px;
  gap: 24px;
  min-height: 500px;
}

.template-create__main {
  min-width: 0;
  padding-right: 24px;
  border-right: 1px solid #e4e8ef;
}

.template-create__label {
  display: block;
  margin: 0 0 7px;
  color: #273142;
  font-size: 11px;
  font-weight: 650;
}

.template-create__label:not(:first-child) {
  margin-top: 16px;
}

.template-create__modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.template-create__mode,
.template-create__modes button {
  border: 1px solid #dfe5ed;
  border-radius: 4px;
  background: #ffffff;
}

.template-create__modes button {
  display: grid;
  min-height: 104px;
  place-items: center;
  align-content: center;
  gap: 4px;
  color: #536075;
}

.template-create__modes button > span {
  color: #55729f;
  font-size: 26px;
  line-height: 1;
}

.template-create__modes strong {
  color: #263142;
  font-size: 12px;
}

.template-create__modes small {
  color: #8b96a8;
  font-size: 10px;
}

.template-create__modes .template-create__mode--active {
  border-color: #1677ff;
  color: #1677ff;
  background: #f7faff;
  box-shadow: inset 0 0 0 1px #1677ff;
}

.template-create__modes .template-create__mode--active span,
.template-create__modes .template-create__mode--active strong {
  color: #1677ff;
}

.template-create__modes button:disabled {
  border-color: #e6eaf0;
  color: #a4adbb;
  background: #f7f8fa;
  cursor: not-allowed;
}

.template-create__modes button:disabled span,
.template-create__modes button:disabled strong,
.template-create__modes button:disabled small {
  color: #a4adbb;
}

.template-create__size {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #e1e6ed;
  border-radius: 4px;
  background: #fafbfc;
}

.template-create__size .template-create__label {
  margin-bottom: 10px;
}

.template-create__size-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.template-create__size-fields > label {
  display: grid;
  gap: 6px;
  color: #68758a;
  font-size: 10px;
}

.template-create__size-input {
  display: flex;
  align-items: center;
  gap: 7px;
}

.template-create__size-input :deep(.ant-input-number) {
  width: 100%;
  border-radius: 3px;
}

.template-create__size-input i {
  color: #8490a3;
  font-size: 10px;
  font-style: normal;
}

.template-create__size-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.template-create__size-presets button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid #dce3ec;
  border-radius: 3px;
  color: #526077;
  background: #ffffff;
  font-size: 9px;
}

.template-create__size-presets button:hover,
.template-create__size-presets .template-create__size-preset--active {
  border-color: #1677ff;
  color: #1677ff;
  background: #f4f8ff;
}

.template-create__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px 64px;
  gap: 8px;
}

.template-create__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
  margin-top: 12px;
}

.template-create__empty {
  grid-column: 1 / -1;
  margin: 14px 0;
  color: #8b96a8;
  font-size: 10px;
  text-align: center;
}

.template-card-shell {
  position: relative;
  min-width: 0;
}

.template-card-shell .template-card {
  width: 100%;
  height: 100%;
}

.template-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 105px;
  grid-template-columns: 47px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dfe5ed;
  border-radius: 4px;
  color: #334155;
  background: #ffffff;
  text-align: left;
}

.template-card--active {
  border-color: #1677ff;
  background: #f8fbff;
  box-shadow: inset 0 0 0 1px #1677ff;
}

.template-card__mini {
  display: flex;
  width: 38px;
  height: 75px;
  align-items: center;
  flex-direction: column;
  justify-content: space-around;
  padding: 5px 3px;
  border: 1px solid #cfd6e0;
  background: #ffffff;
}

.template-card__mini i,
.template-card__mini em {
  display: block;
  width: 22px;
  height: 5px;
  background: #dce4ef;
}

.template-card__mini em {
  width: 20px;
  height: 20px;
  background: repeating-linear-gradient(45deg, #172033 0 2px, #fff 2px 4px);
}

.template-card__mini b {
  font-size: 7px;
  font-style: normal;
}

.template-card__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.template-card__copy strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__copy small {
  color: #758196;
  font-size: 9px;
}

.template-card__delete {
  position: absolute;
  z-index: 2;
  top: 7px;
  right: 7px;
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #8b96a8;
  background: transparent;
  font-size: 17px;
  line-height: 1;
}

.template-card__delete:hover {
  border-color: #ffccc7;
  color: #ff4d4f;
  background: #fff2f0;
}

.template-card__check {
  position: absolute;
  top: 8px;
  right: 38px;
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: #1677ff;
  font-size: 11px;
}

.template-create__preview {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #718096;
  font-size: 10px;
  text-align: center;
}

.template-create__preview h3 {
  align-self: flex-start;
  margin: 0 0 24px;
  color: #273142;
  font-size: 12px;
}

.template-create__paper {
  position: relative;
  display: flex;
  overflow: hidden;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d4dbe5;
  color: #172033;
  background: #ffffff;
  box-shadow: 0 6px 15px rgb(15 23 42 / 8%);
}

.template-create__artwork {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: left top;
  pointer-events: none;
}

.template-create__paper--blank {
  justify-content: center;
  color: #a0aabc;
}

.template-create__blank-tip {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccd5e1;
  border-radius: 3px;
  color: #98a3b3;
  background: #fafbfd;
  font-size: 9px;
}

.template-create__preview-name {
  margin-top: 20px;
  color: #273142;
  font-size: 11px;
}

.template-create__preview > span {
  margin-top: 5px;
}

.template-dialog__footer--create {
  align-items: center;
  justify-content: space-between;
}

.template-dialog__footer--create > span {
  color: #8a96a8;
  font-size: 9px;
}

.template-dialog__footer--create > div {
  display: flex;
  gap: 10px;
}

.template-dialog__form :deep(.ant-input),
.template-dialog__form :deep(.ant-select-selector),
.template-create :deep(.ant-input),
.template-create :deep(.ant-btn) {
  border-radius: 3px !important;
}

@media (max-width: 760px) {
  .template-create {
    grid-template-columns: 1fr;
  }

  .template-create__main {
    padding-right: 0;
    border-right: 0;
  }

  .template-create__preview {
    display: none;
  }
}
</style>
