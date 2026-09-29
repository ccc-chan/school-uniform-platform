<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import { getCompanyOptions, type Company } from '@/api/companies'
import type { SchoolOption } from '@/api/schools'
import {
  createProduct,
  getProduct,
  productCategoryOptions,
  productExecutionStandardOptions,
  productQrCodeTypeOptions,
  productSafetyCategoryOptions,
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
interface PendingProductImage {
  file: File
  previewUrl: string
}

const pendingImages = shallowRef<PendingProductImage[]>([])
const existingImageIds = shallowRef<number[]>([])
const fabricComposition = shallowRef('')
const fabricRatio = shallowRef('')
const companies = shallowRef<Company[]>([])
const selectedSchools = shallowRef<SchoolOption[]>([])
const isEdit = computed(() => Boolean(props.productId))
const imageCount = computed(
  () => existingImageIds.value.length + pendingImages.value.length,
)

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
    category: 'set',
    qrCodeType: 'product',
    schoolIds: [],
    season: 'spring',
    style: '',
    color: '',
    sizes: [],
    fabricInfo: '',
    executionStandard: '',
    washingInstructions: '',
    safetyCategory: '',
    companyId: null,
    images: [],
    retainedImageIds: [],
  }
}

const form = reactive<ProductInput>(createEmptyForm())

function clearPreviews() {
  pendingImages.value.forEach(({ previewUrl }) =>
    URL.revokeObjectURL(previewUrl),
  )
  pendingImages.value = []
}

function resetForm() {
  clearPreviews()
  Object.assign(form, createEmptyForm())
  existingImageIds.value = []
  fabricComposition.value = ''
  fabricRatio.value = ''
  selectedSchools.value = []
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
    schoolIds: [...(product.schoolIds ?? [])],
    season: product.season ?? defaults.season,
    style: product.style ?? '',
    color: product.color ?? '',
    sizes: [...(product.sizes ?? [])],
    fabricInfo: product.fabricInfo ?? '',
    executionStandard: product.executionStandard ?? '',
    washingInstructions: product.washingInstructions ?? '',
    safetyCategory: product.safetyCategory ?? '',
    companyId: product.companyId ?? null,
    images: [],
    retainedImageIds: [
      ...(product.imageIds ?? (product.imageId ? [product.imageId] : [])),
    ],
  })

  existingImageIds.value = [...form.retainedImageIds]
  selectedSchools.value = [...(product.schools ?? [])]
  fabricComposition.value = composition
  fabricRatio.value = ratioParts.join(' · ')
}

let loadSequence = 0

watch([() => props.open, () => props.productId], async ([open, productId]) => {
  const sequence = ++loadSequence
  loading.value = false

  if (!open) return

  resetForm()
  try {
    companies.value = await getCompanyOptions()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '管理公司加载失败')
    emit('close')
    return
  }
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

function selectImage(file: File) {
  if (imageCount.value >= 3) {
    message.warning('产品图片最多上传 3 张')
    return
  }

  pendingImages.value = [
    ...pendingImages.value,
    { file, previewUrl: URL.createObjectURL(file) },
  ]
  form.images = pendingImages.value.map((item) => item.file)
}

function removeExistingImage(id: number) {
  existingImageIds.value = existingImageIds.value.filter(
    (imageId) => imageId !== id,
  )
  form.retainedImageIds = [...existingImageIds.value]
}

function removePendingImage(index: number) {
  const target = pendingImages.value[index]
  if (target) URL.revokeObjectURL(target.previewUrl)
  pendingImages.value = pendingImages.value.filter(
    (_, itemIndex) => itemIndex !== index,
  )
  form.images = pendingImages.value.map((item) => item.file)
}

function requestClose() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (!form.name.trim() || imageCount.value === 0) {
    message.warning('请填写产品名称并上传产品图片')
    return
  }

  if (
    !form.executionStandard.trim() ||
    !form.washingInstructions.trim() ||
    !form.safetyCategory.trim() ||
    !form.companyId
  ) {
    message.warning('请完整填写产品信息并选择管理公司')
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

onBeforeUnmount(clearPreviews)
</script>

<template>
  <a-drawer
    :open="open"
    width="min(720px, 100vw)"
    :closable="false"
    root-class-name="product-create-drawer"
    @close="requestClose"
  >
    <template #title>
      <div class="product-create-drawer__heading">
        <span class="product-create-drawer__title-mark" aria-hidden="true">产</span>
        <div>
          <strong>{{ isEdit ? '编辑产品档案' : '新增产品档案' }}</strong>
          <span>
            {{
              isEdit
                ? '更新产品资料、管理公司与溯源设置'
                : '录入产品资料、管理公司与溯源设置'
            }}
          </span>
        </div>
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
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">
              溯源模式 <em>*</em>
            </h3>
            <p>设置二维码与产品之间的绑定方式</p>
          </div>
          <span>二维码规则</span>
        </div>

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
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">适用学校</h3>
            <p>按学校名称或学校代码搜索，可选择多所学校</p>
          </div>
          <span>学校范围</span>
        </div>

        <SchoolSelect
          v-model="form.schoolIds"
          multiple
          :initial-options="selectedSchools"
        />
      </section>

      <section class="product-create-drawer__section">
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">基本信息</h3>
            <p>填写产品名称、分类及执行标准</p>
          </div>
          <span>产品资料</span>
        </div>

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

          <label
            class="product-create-drawer__field product-create-drawer__field--full"
          >
            <span>执行标准 <em>*</em></span>
            <a-select
              v-model:value="form.executionStandard"
              :options="productExecutionStandardOptions"
              placeholder="请选择执行标准"
            />
          </label>

          <label
            class="product-create-drawer__field product-create-drawer__field--full"
          >
            <span>洗涤说明 <em>*</em></span>
            <a-input
              v-model:value="form.washingInstructions"
              placeholder="请输入洗涤说明"
            />
          </label>

          <label
            class="product-create-drawer__field product-create-drawer__field--full"
          >
            <span>安全类别 <em>*</em></span>
            <a-select
              v-model:value="form.safetyCategory"
              :options="productSafetyCategoryOptions"
              placeholder="请选择安全类别"
            />
          </label>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">
              管理公司 <em>*</em>
            </h3>
            <p>选择负责该产品的企业主体</p>
          </div>
          <span>企业归属</span>
        </div>

        <div class="product-create-drawer__form-grid">
          <label
            class="product-create-drawer__field product-create-drawer__field--full"
          >
            <span>管理公司 <em>*</em></span>
            <a-select
              :value="form.companyId ?? undefined"
              @update:value="form.companyId = Number($event)"
              show-search
              option-filter-prop="label"
              placeholder="请选择管理公司"
              :options="companies.map(item => ({ label: item.name, value: item.id }))"
            />
          </label>
          <div v-if="companies.find(item => item.id === form.companyId)" class="product-create-drawer__company product-create-drawer__field--full">
            <span>法人：{{ companies.find(item => item.id === form.companyId)?.legalRepresentative || '—' }}</span>
            <span>地址：{{ companies.find(item => item.id === form.companyId)?.address || '—' }}</span>
            <span>联系电话：{{ companies.find(item => item.id === form.companyId)?.contactPhone || '—' }}</span>
          </div>
        </div>
      </section>

      <section class="product-create-drawer__section">
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">面料信息</h3>
            <p>补充产品面料成分与配比</p>
          </div>
          <span>材质说明</span>
        </div>

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
        <div class="product-create-drawer__section-heading">
          <div>
            <h3 class="product-create-drawer__section-title">
              产品图片 <em>*</em>
            </h3>
            <p>上传清晰完整的产品展示图片，第一张将作为封面</p>
          </div>
          <span>{{ imageCount }}/3</span>
        </div>

        <div v-if="imageCount" class="product-create-drawer__image-grid">
          <div
            v-for="imageId in existingImageIds"
            :key="`existing-${imageId}`"
            class="product-create-drawer__preview"
          >
            <ProductImage :file-id="imageId" variant="card" />
            <button type="button" @click="removeExistingImage(imageId)">删除</button>
          </div>
          <div
            v-for="(image, index) in pendingImages"
            :key="image.previewUrl"
            class="product-create-drawer__preview"
          >
            <img :src="image.previewUrl" alt="产品图片预览" />
            <button type="button" @click="removePendingImage(index)">删除</button>
          </div>
        </div>

        <FileUpload
          v-if="imageCount < 3"
          mode="custom"
          dragger
          multiple
          :auto-upload="false"
          accept="image/jpeg,image/png"
          :allowed-types="['image/jpeg', 'image/png']"
          :max-size-mb="5"
          invalid-type-message="仅支持 JPG、PNG 图片"
          @select="selectImage"
        >
          <div class="flex flex-col items-center">
            <div class="flex flex-col items-center text-center">
              <strong>{{ imageCount ? '继续添加图片' : '点击上传或拖拽图片' }}</strong>
              <span>支持 JPG、PNG，最多 3 张，单张不超过 5MB</span>
            </div>
          </div>
        </FileUpload>
      </section>
    </div>

    <template #footer>
      <div class="product-create-drawer__footer">
        <span><em>*</em> 为必填信息</span>
        <div>
          <a-button :disabled="saving" @click="requestClose">取消</a-button>
          <a-button
            type="primary"
            :disabled="loading"
            :loading="saving"
            @click="submit"
          >
            {{ isEdit ? '保存修改' : '创建产品' }}
          </a-button>
        </div>
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
  background: #f4f7fb;
}

.product-create-drawer .ant-drawer-footer {
  padding: 16px 22px;
  border-top-color: #e5ebf3;
  background: #fff;
}

.product-create-drawer__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.product-create-drawer__title-mark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border-radius: 11px;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 8px 18px rgb(37 99 235 / 22%);
  font-size: 16px;
  font-weight: 800;
}

.product-create-drawer__heading .product-create-drawer__title-mark {
  color: #fff;
}

.product-create-drawer__heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
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
  padding: 24px;
  flex-direction: column;
  gap: 16px;
}

.product-create-drawer__section {
  min-width: 0;
  padding: 20px;
  border: 1px solid #e5eaf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgb(15 23 42 / 4%);
}

.product-create-drawer__section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-left: 11px;
  border-left: 3px solid #2563eb;
}

.product-create-drawer__section-heading p {
  margin: 3px 0 0;
  color: #8a96a8;
  font-size: 12px;
}

.product-create-drawer__section-heading > span {
  flex: none;
  padding: 4px 9px;
  border-radius: 999px;
  color: #55708f;
  background: #f0f5fb;
  font-size: 11px;
}

.product-create-drawer__section-title {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.4;
}

.product-create-drawer__section-tip {
  margin: -2px 0 10px;
  color: #7b8da6;
  font-size: 12px;
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
  gap: 18px 16px;
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
  min-height: 38px;
  border-color: #dfe5ee;
  border-radius: 8px !important;
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
  border-radius: 11px;
  background: #f8faff;
}

.product-create-drawer .ant-upload-wrapper .ant-upload-drag:hover {
  border-color: #2563eb;
  background: #f2f7ff;
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
  height: 150px;
  overflow: hidden;
  border: 1px solid #dce5f1;
  border-radius: 14px;
  background: #f8fafc;
}

.product-create-drawer__image-grid {
  display: grid;
  margin-bottom: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.product-create-drawer__footer > span {
  color: #8a96a8;
  font-size: 12px;
}

.product-create-drawer__footer > span em {
  color: #ef4444;
  font-style: normal;
}

.product-create-drawer__footer > div {
  display: flex;
  gap: 10px;
}

.product-create-drawer__company {
  display: flex;
  padding: 12px 14px;
  border-radius: 10px;
  color: #64748b;
  background: #f8fafc;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
}

.product-create-drawer__footer .ant-btn {
  min-width: 92px;
  height: 38px;
  border-radius: 8px;
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
    padding: 16px;
  }

  .product-create-drawer__section {
    padding: 16px;
  }

  .product-create-drawer__qr-grid,
  .product-create-drawer__form-grid {
    grid-template-columns: 1fr;
  }

  .product-create-drawer__field--full {
    grid-column: auto;
  }

  .product-create-drawer__section-heading > span,
  .product-create-drawer__footer > span {
    display: none;
  }

  .product-create-drawer__footer {
    justify-content: flex-end;
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
