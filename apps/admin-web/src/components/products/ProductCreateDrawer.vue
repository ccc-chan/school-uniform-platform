<script setup lang="ts">
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import {
  createProduct,
  getProduct,
  productCategoryOptions,
  productQrCodeTypeOptions,
  productSeasonOptions,
  productSizeOptions,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductQrCodeType,
  type ProductSize,
} from '@/api/products'

type ProductFormMode = 'create' | 'edit'

const props = defineProps<{
  open: boolean
  productId?: number | null
}>()
const emit = defineEmits<{
  close: []
  saved: [product: Product, mode: ProductFormMode]
}>()

const loading = shallowRef(false)
const saving = shallowRef(false)
const previewUrl = shallowRef('')
const existingImageId = shallowRef<number | null>(null)
const fabricComposition = shallowRef('')
const fabricRatio = shallowRef('')
const isEdit = computed(() => Boolean(props.productId))

const qrDescriptions: Record<ProductQrCodeType, string> = {
  product: '每件独立码',
  batch: '批次共用',
  school: '学校共用',
}

const fabricOptions = [
  { label: '纯棉', value: '纯棉' },
  { label: '聚酯纤维', value: '聚酯纤维' },
  { label: '涤棉混纺', value: '涤棉混纺' },
  { label: '锦纶混纺', value: '锦纶混纺' },
]

const numericSizeOptions = productSizeOptions.filter((item) =>
  /^\d+$/.test(item.value),
)

function createProductCode() {
  const year = new Date().getFullYear()
  const random = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .toUpperCase()
    .padStart(6, '0')
    .slice(-6)

  return `TY-${year}-${random}`
}

function createEmptyForm(): ProductInput {
  return {
    name: '',
    code: createProductCode(),
    category: 'sports_set',
    qrCodeType: 'product',
    applicableSchools: [],
    season: 'spring',
    style: '',
    color: '',
    sizes: [],
    fabricInfo: '',
    executionStandard: '',
    washingInstructions: '',
    image: null,
  }
}

const form = reactive<ProductInput>(createEmptyForm())

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function resetForm() {
  clearPreview()
  Object.assign(form, createEmptyForm())
  existingImageId.value = null
  fabricComposition.value = ''
  fabricRatio.value = ''
}

function fillForm(product: Product) {
  const defaults = createEmptyForm()
  const [composition = '', ...ratioParts] = (product.fabricInfo || '').split(
    ' · ',
  )

  Object.assign(form, defaults, {
    name: product.name ?? '',
    code: product.code ?? defaults.code,
    category: product.category ?? defaults.category,
    qrCodeType: product.qrCodeType ?? defaults.qrCodeType,
    applicableSchools: [...(product.applicableSchools ?? [])],
    season: product.season ?? defaults.season,
    style: product.style ?? '',
    color: product.color ?? '',
    sizes: [...(product.sizes ?? [])],
    fabricInfo: product.fabricInfo ?? '',
    executionStandard: product.executionStandard ?? '',
    washingInstructions: product.washingInstructions ?? '',
    image: null,
  })

  existingImageId.value = product.imageId ?? null
  fabricComposition.value = composition
  fabricRatio.value = ratioParts.join(' · ')
}

let loadSequence = 0

watch([() => props.open, () => props.productId], async ([open, productId]) => {
  const sequence = ++loadSequence
  loading.value = false

  if (!open) return

  resetForm()
  if (!productId) return

  loading.value = true

  try {
    const product = await getProduct(productId)
    if (sequence === loadSequence) fillForm(product)
  } catch (error) {
    if (sequence !== loadSequence) return
    message.error(error instanceof Error ? error.message : '产品加载失败')
    emit('close')
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
})

function selectQrCodeType(value: ProductQrCodeType) {
  form.qrCodeType = value
}

function toggleSize(value: ProductSize) {
  form.sizes = form.sizes.includes(value)
    ? form.sizes.filter((size) => size !== value)
    : [...form.sizes, value]
}

function beforeUpload(file: File) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    message.error('仅支持 JPG、PNG 图片')
    return false
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5MB')
    return false
  }

  clearPreview()
  previewUrl.value = URL.createObjectURL(file)
  form.image = file
  return false
}

function removeImage() {
  clearPreview()
  form.image = null
}

function requestClose() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (
    !form.name.trim() ||
    (!form.image && !existingImageId.value)
  ) {
    message.warning('请填写产品名称并上传产品图片')
    return
  }

  saving.value = true

  try {
    const productId = props.productId
    const payload = {
      ...form,
      fabricInfo: [fabricComposition.value, fabricRatio.value.trim()]
        .filter(Boolean)
        .join(' · '),
    }
    const product = productId
      ? await updateProduct(productId, payload)
      : await createProduct(payload)

    emit('saved', product, productId ? 'edit' : 'create')
  } catch (error) {
    message.error(
      error instanceof Error
        ? error.message
        : isEdit.value
          ? '产品更新失败'
          : '产品创建失败',
    )
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(clearPreview)
</script>

<template>
  <a-drawer
    :open="open"
    width="min(520px, 100vw)"
    :closable="false"
    root-class-name="product-create-drawer"
    @close="requestClose"
  >
    <template #title>
      <div class="product-create-drawer__heading">
        <strong>{{ isEdit ? '编辑产品' : '新建产品' }}</strong>
        <span>
          {{
            isEdit
              ? '修改产品基本信息与溯源设置'
              : '填写产品基本信息，款号已自动生成'
          }}
        </span>
      </div>
    </template>

    <template #extra>
      <button
        type="button"
        class="product-create-drawer__close"
        aria-label="关闭"
        :disabled="saving"
        @click="requestClose"
      >
        ×
      </button>
    </template>

    <div class="product-create-drawer__content">
      <section class="product-create-drawer__section">
        <h3 class="product-create-drawer__section-title">
          溯源模式 <em>*</em>
        </h3>

        <div class="product-create-drawer__qr-grid">
          <button
            v-for="option in productQrCodeTypeOptions"
            :key="option.value"
            type="button"
            class="product-create-drawer__qr-option"
            :class="{
              'product-create-drawer__qr-option--active':
                form.qrCodeType === option.value,
            }"
            :aria-pressed="form.qrCodeType === option.value"
            @click="selectQrCodeType(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <span>{{ qrDescriptions[option.value] }}</span>
          </button>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <h3 class="product-create-drawer__section-title">基本信息</h3>

        <div class="product-create-drawer__form-grid">
          <label
            class="product-create-drawer__field product-create-drawer__field--full"
          >
            <span>产品名称 <em>*</em></span>
            <a-input
              v-model:value="form.name"
              placeholder="如：春季运动校服（蓝色）"
            />
          </label>

          <label class="product-create-drawer__field">
            <span>产品分类</span>
            <a-select
              v-model:value="form.category"
              :options="productCategoryOptions"
              allow-clear
              placeholder="请选择"
            />
          </label>

          <label class="product-create-drawer__field">
            <span>季节</span>
            <a-select
              v-model:value="form.season"
              :options="productSeasonOptions"
              allow-clear
              placeholder="请选择"
            />
          </label>

          <label class="product-create-drawer__field">
            <span>颜色</span>
            <a-input v-model:value="form.color" placeholder="如：蓝色" />
          </label>

          <label class="product-create-drawer__field">
            <span>款号</span>
            <a-input :value="form.code" disabled />
          </label>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <h3 class="product-create-drawer__section-title">面料信息</h3>

        <div class="product-create-drawer__form-grid">
          <label class="product-create-drawer__field">
            <span>面料成分</span>
            <a-select
              v-model:value="fabricComposition"
              :options="fabricOptions"
              allow-clear
              placeholder="请选择"
            />
          </label>

          <label class="product-create-drawer__field">
            <span>面料配比</span>
            <a-input v-model:value="fabricRatio" placeholder="如 65/35" />
          </label>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <h3 class="product-create-drawer__section-title">
          支持尺码
        </h3>

        <div class="product-create-drawer__sizes">
          <button
            v-for="option in numericSizeOptions"
            :key="option.value"
            type="button"
            :class="{
              'product-create-drawer__size--active': form.sizes.includes(
                option.value,
              ),
            }"
            :aria-pressed="form.sizes.includes(option.value)"
            @click="toggleSize(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <h3 class="product-create-drawer__section-title">
          产品图片 <em>*</em>
        </h3>

        <div v-if="previewUrl" class="product-create-drawer__preview">
          <img :src="previewUrl" alt="产品图片预览" />
          <button type="button" @click="removeImage">撤销更换</button>
        </div>

        <div v-else-if="existingImageId" class="product-create-drawer__preview">
          <ProductImage :file-id="existingImageId" variant="card" />
          <a-upload
            :before-upload="beforeUpload"
            :show-upload-list="false"
            accept="image/jpeg,image/png"
          >
            <button type="button">重新上传</button>
          </a-upload>
        </div>

        <a-upload-dragger
          v-else
          :before-upload="beforeUpload"
          :show-upload-list="false"
          accept="image/jpeg,image/png"
        >
          <div class="flex flex-col items-center">
            <p class="ant-upload-drag-icon">
              <inboxOutlined></inboxOutlined>
            </p>
            <div class="flex flex-col items-center text-center">
              <strong>点击上传或拖拽图片</strong>
              <span>支持 JPG、PNG，建议 800×800px</span>
            </div>
          </div>
        </a-upload-dragger>
      </section>
    </div>

    <template #footer>
      <div class="product-create-drawer__footer">
        <a-button :disabled="saving" @click="requestClose">取消</a-button>
        <a-button
          type="primary"
          :disabled="loading"
          :loading="saving"
          @click="submit"
        >
          {{ isEdit ? '保存修改' : '提交创建' }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>

<style>
.product-create-drawer .ant-drawer-header {
  min-height: 77px;
  padding: 18px 22px;
  border-bottom-color: #e5ebf3;
}

.product-create-drawer .ant-drawer-title {
  min-width: 0;
}

.product-create-drawer .ant-drawer-body {
  padding: 0;
  background: #fff;
}

.product-create-drawer .ant-drawer-footer {
  padding: 16px 22px;
  border-top-color: #e5ebf3;
  background: #fff;
}

.product-create-drawer__heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.product-create-drawer__heading strong {
  color: #172033;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.product-create-drawer__heading span {
  overflow: hidden;
  color: #7b8da6;
  font-size: 12px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-create-drawer__close {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: #8798af;
  background: transparent;
  font-size: 25px;
  font-weight: 300;
  line-height: 30px;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.product-create-drawer__close:hover {
  color: #334155;
  background: #f1f5f9;
}

.product-create-drawer__close:focus-visible,
.product-create-drawer__qr-option:focus-visible,
.product-create-drawer__sizes button:focus-visible,
.product-create-drawer__preview button:focus-visible {
  outline: 2px solid #83a9f7;
  outline-offset: 2px;
}

.product-create-drawer__content {
  display: flex;
  padding: 18px 22px 30px;
  flex-direction: column;
  gap: 22px;
}

.product-create-drawer__section {
  min-width: 0;
}

.product-create-drawer__section-title {
  margin: 0 0 10px;
  color: #26364c;
  font-size: 13px;
  font-style: normal;
  font-weight: 650;
  line-height: 1.5;
}

.product-create-drawer em,
.product-create-drawer__field em {
  margin-left: 2px;
  color: #ef4444;
  font-style: normal;
}

.product-create-drawer__qr-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.product-create-drawer__qr-option {
  display: flex;
  min-width: 0;
  min-height: 62px;
  padding: 11px 14px;
  border: 1px solid #dce5f1;
  border-radius: 12px;
  color: #42546c;
  background: #fff;
  text-align: left;
  flex-direction: column;
  gap: 3px;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.product-create-drawer__qr-option strong {
  color: #1e293b;
  font-size: 13px;
  font-weight: 650;
}

.product-create-drawer__qr-option span {
  color: #8b9bb0;
  font-size: 11px;
  line-height: 1.4;
}

.product-create-drawer__qr-option--active {
  border-color: #2563eb;
  background: #f3f7ff;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 14%);
}

.product-create-drawer__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.product-create-drawer__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.product-create-drawer__field--full {
  grid-column: 1 / -1;
}

.product-create-drawer__field > span {
  color: #26364c;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.product-create-drawer__field .ant-input,
.product-create-drawer__field .ant-select-selector {
  min-height: 42px;
  border-radius: 10px !important;
}

.product-create-drawer__field .ant-select-selector {
  display: flex;
  align-items: center;
}

.product-create-drawer__sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-create-drawer__sizes button {
  min-width: 52px;
  height: 34px;
  padding: 0 13px;
  border: 1px solid #dce5f1;
  border-radius: 9px;
  color: #53657c;
  background: #fff;
  font-size: 13px;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background-color 160ms ease;
}

.product-create-drawer__sizes .product-create-drawer__size--active {
  border-color: #2563eb;
  color: #fff;
  background: #2563eb;
}

.product-create-drawer .ant-upload-wrapper .ant-upload-drag {
  min-height: 148px;
  border-color: #cfdaea;
  border-radius: 14px;
  background: #fff;
}

.product-create-drawer .ant-upload-wrapper .ant-upload-drag:hover {
  border-color: #6692ee;
}

.product-create-drawer
  .ant-upload-wrapper
  .ant-upload-drag
  .ant-upload-drag-container {
  display: flex;
  min-height: 146px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 16px;
}

.product-create-drawer .ant-upload-drag-container strong {
  margin-top: 0;
  color: #34455c;
  font-size: 13px;
}

.product-create-drawer .ant-upload-drag-container span {
  margin-top: 0;
  color: #91a0b5;
  font-size: 11px;
}

.product-create-drawer__upload-icon {
  display: grid;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: #7890ad;
  background: #f1f5f9;
  font-size: 23px;
  place-items: center;
}

.product-create-drawer__preview {
  position: relative;
  height: 190px;
  overflow: hidden;
  border: 1px solid #dce5f1;
  border-radius: 14px;
  background: #f8fafc;
}

.product-create-drawer__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-create-drawer__preview .product-image {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
}

.product-create-drawer__preview button {
  position: absolute;
  right: 12px;
  bottom: 12px;
  height: 32px;
  padding: 0 13px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  background: rgb(15 23 42 / 78%);
  font-size: 12px;
}

.product-create-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.product-create-drawer__footer .ant-btn {
  min-width: 76px;
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
}

.product-create-drawer__footer .ant-btn-primary {
  min-width: 102px;
  box-shadow: 0 7px 15px rgb(37 99 235 / 20%);
}

@media (max-width: 520px) {
  .product-create-drawer .ant-drawer-header,
  .product-create-drawer .ant-drawer-footer {
    padding-inline: 16px;
  }

  .product-create-drawer__content {
    padding-inline: 16px;
  }

  .product-create-drawer__qr-grid,
  .product-create-drawer__form-grid {
    grid-template-columns: 1fr;
  }

  .product-create-drawer__field--full {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-create-drawer__close,
  .product-create-drawer__qr-option,
  .product-create-drawer__sizes button {
    transition: none;
  }
}
</style>
