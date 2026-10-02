<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import { checkProductCodeExists, createProduct, getProduct, productCategoryOptions, productGenderOptions, productSchoolStageOptions, productSeasonOptions, updateProduct, type Product, type ProductInput } from '@/api/products'

type ProductFormMode = 'create' | 'edit'
interface PendingProductImage { file: File; previewUrl: string }
const props = defineProps<{ open: boolean; productId?: number | null }>()
const emit = defineEmits<{ close: []; saved: [product: Product, mode: ProductFormMode] }>()
const PRODUCT_CODE_PATTERN = /^[A-Z0-9]{1,5}$/
const loading = shallowRef(false), saving = shallowRef(false), checkingCode = shallowRef(false)
const codeError = shallowRef(''), codeChecked = shallowRef(false)
const pendingImages = shallowRef<PendingProductImage[]>([]), existingImageIds = shallowRef<number[]>([])
const isEdit = computed(() => Boolean(props.productId))
const imageCount = computed(() => existingImageIds.value.length + pendingImages.value.length)
const emptyForm = (): ProductInput => ({ name: '', code: '', category: 'short_sleeve_top', schoolStage: 'universal', gender: 'unisex', season: 'all_season', images: [], retainedImageIds: [] })
const form = reactive<ProductInput>(emptyForm())

function clearPreviews() { pendingImages.value.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)); pendingImages.value = [] }
function resetForm() { clearPreviews(); Object.assign(form, emptyForm()); existingImageIds.value = []; codeError.value = ''; codeChecked.value = false }
function fillForm(product: Product) {
  const defaults = emptyForm()
  Object.assign(form, defaults, { name: product.name ?? '', code: product.code ?? '', category: product.category ?? defaults.category, schoolStage: product.schoolStage ?? defaults.schoolStage, gender: product.gender ?? defaults.gender, season: product.season ?? defaults.season, retainedImageIds: [...(product.imageIds ?? (product.imageId ? [product.imageId] : []))] })
  existingImageIds.value = [...form.retainedImageIds]; codeChecked.value = false
}
let loadSequence = 0
watch([() => props.open, () => props.productId], async ([open, productId]) => {
  const sequence = ++loadSequence; loading.value = false
  if (!open) return
  resetForm()
  if (!productId) return
  loading.value = true
  try { const product = await getProduct(productId); if (sequence === loadSequence) fillForm(product) }
  catch (error) { if (sequence !== loadSequence) return; message.error(error instanceof Error ? error.message : '产品加载失败'); emit('close') }
  finally { if (sequence === loadSequence) loading.value = false }
})
function handleCodeInput(value: string) { form.code = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); codeError.value = ''; codeChecked.value = false }
async function validateCodeAvailability() {
  if (!PRODUCT_CODE_PATTERN.test(form.code)) { codeError.value = '产品编码只能包含大写字母和数字，且不超过 5 位'; codeChecked.value = false; return false }
  checkingCode.value = true
  const checkedCode = form.code
  try {
    const result = await checkProductCodeExists(checkedCode, props.productId)
    if (form.code !== checkedCode) return false
    codeError.value = result.exists ? '产品编码已存在，请重新输入' : ''
    codeChecked.value = !result.exists
    return !result.exists
  }
  catch (error) { codeChecked.value = false; codeError.value = error instanceof Error ? error.message : '编码校验失败'; return false }
  finally { checkingCode.value = false }
}
function selectImage(file: File) {
  if (imageCount.value >= 5) return void message.warning('产品图片最多上传 5 张')
  pendingImages.value = [...pendingImages.value, { file, previewUrl: URL.createObjectURL(file) }]
  form.images = pendingImages.value.map((item) => item.file)
}
function removeExistingImage(id: number) { existingImageIds.value = existingImageIds.value.filter((imageId) => imageId !== id); form.retainedImageIds = [...existingImageIds.value] }
function removePendingImage(index: number) { const target = pendingImages.value[index]; if (target) URL.revokeObjectURL(target.previewUrl); pendingImages.value = pendingImages.value.filter((_, itemIndex) => itemIndex !== index); form.images = pendingImages.value.map((item) => item.file) }
function requestClose() { if (!saving.value) emit('close') }
async function submit() {
  form.name = form.name.trim()
  if (!form.name || [...form.name].length > 10) return void message.warning('产品名称不能为空且不能超过 10 个字')
  if (!form.schoolStage || !form.category || !form.gender || !form.season) return void message.warning('请完整填写产品信息')
  if (!imageCount.value) return void message.warning('请上传产品图片')
  if (!codeChecked.value && !(await validateCodeAvailability())) return
  saving.value = true
  try { const productId = props.productId; const product = productId ? await updateProduct(productId, form) : await createProduct(form); emit('saved', product, productId ? 'edit' : 'create') }
  catch (error) { message.error(error instanceof Error ? error.message : isEdit.value ? '产品更新失败' : '产品创建失败') }
  finally { saving.value = false }
}
onBeforeUnmount(clearPreviews)
</script>

<template>
  <a-drawer :open="open" width="min(720px, 100vw)" :closable="false" root-class-name="product-create-drawer" @close="requestClose">
    <template #title><div class="drawer-heading"><span class="title-mark">产</span><div><strong>{{ isEdit ? '编辑产品' : '新增产品' }}</strong><small>填写产品基础资料和展示图片</small></div></div></template>
    <template #extra><button type="button" class="close-button" :disabled="saving" aria-label="关闭" @click="requestClose">×</button></template>
    <a-spin :spinning="loading"><div class="drawer-content">
      <section class="form-section">
        <header class="section-heading"><div><h3>产品信息</h3><p>带星号的内容均为必填项</p></div><span>基础资料</span></header>
        <div class="form-grid">
          <label class="field field--full"><span>产品名称 <em>*</em></span><a-input v-model:value="form.name" :maxlength="10" show-count placeholder="请输入产品名称" /></label>
          <label class="field field--full"><span>产品编码 <em>*</em></span><a-input :value="form.code" :maxlength="5" show-count placeholder="请输入不超过 5 位大写字母或数字" :status="codeError ? 'error' : undefined" @update:value="handleCodeInput(String($event))" @blur="validateCodeAvailability" /><small v-if="checkingCode">正在查询编码...</small><small v-else-if="codeError" class="field-error">{{ codeError }}</small></label>
          <label class="field"><span>学段年级 <em>*</em></span><a-select v-model:value="form.schoolStage" :options="productSchoolStageOptions" placeholder="请选择学段年级" /></label>
          <label class="field"><span>产品类型 <em>*</em></span><a-select v-model:value="form.category" :options="productCategoryOptions" placeholder="请选择产品类型" /></label>
          <label class="field"><span>性别 <em>*</em></span><a-select v-model:value="form.gender" :options="productGenderOptions" placeholder="请选择性别" /></label>
          <label class="field"><span>季节 <em>*</em></span><a-select v-model:value="form.season" :options="productSeasonOptions" placeholder="请选择季节" /></label>
        </div>
      </section>
      <section class="form-section">
        <header class="section-heading"><div><h3>产品图片 <em>*</em></h3><p>第一张图片将作为产品封面</p></div><span>{{ imageCount }}/5</span></header>
        <div v-if="imageCount" class="image-grid"><div v-for="imageId in existingImageIds" :key="`existing-${imageId}`" class="image-preview"><ProductImage :file-id="imageId" variant="card" /><button type="button" @click="removeExistingImage(imageId)">删除</button></div><div v-for="(image, index) in pendingImages" :key="image.previewUrl" class="image-preview"><img :src="image.previewUrl" alt="产品图片预览" /><button type="button" @click="removePendingImage(index)">删除</button></div></div>
        <FileUpload v-if="imageCount < 5" mode="custom" dragger multiple :auto-upload="false" accept="image/jpeg,image/png,image/webp" :allowed-types="['image/jpeg', 'image/png', 'image/webp']" :max-size-mb="5" invalid-type-message="仅支持 JPG、PNG、WEBP 图片" @select="selectImage"><div class="upload-copy"><strong>{{ imageCount ? '继续添加图片' : '点击上传或拖拽图片' }}</strong><span>支持 JPG、PNG、WEBP，最多 5 张，单张不超过 5MB</span></div></FileUpload>
      </section>
    </div></a-spin>
    <template #footer><div class="drawer-footer"><span><em>*</em> 为必填信息</span><div><a-button :disabled="saving" @click="requestClose">取消</a-button><a-button type="primary" :disabled="loading || checkingCode" :loading="saving" @click="submit">{{ isEdit ? '保存修改' : '创建产品' }}</a-button></div></div></template>
  </a-drawer>
</template>

<style scoped>
.drawer-heading,.drawer-heading div,.upload-copy{display:flex;flex-direction:column}.drawer-heading{align-items:center;flex-direction:row;gap:12px}.drawer-heading small{margin-top:3px;color:#8492a6;font-weight:400}.title-mark{display:grid;width:38px;height:38px;border-radius:11px;background:#e8f1ff;color:#2563eb;font-weight:700;place-items:center}.close-button{border:0;background:transparent;color:#64748b;font-size:24px;cursor:pointer}.drawer-content{display:flex;padding:20px;background:#f4f7fb;flex-direction:column;gap:18px}.form-section{padding:20px;border:1px solid #e0e7f0;border-radius:14px;background:#fff}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:16px}.section-heading h3{margin:0;color:#1e293b;font-size:16px}.section-heading p{margin:5px 0 0;color:#8492a6;font-size:12px}.section-heading>span{padding:4px 9px;border-radius:999px;background:#eef4ff;color:#4b74b7;font-size:12px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.field{display:flex;min-width:0;flex-direction:column;gap:8px;color:#475569;font-size:13px}.field--full{grid-column:1/-1}.field em,.section-heading em,.drawer-footer em{color:#ef4444;font-style:normal}.field-error{color:#ef4444}.image-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin-bottom:16px;gap:12px}.image-preview{position:relative;overflow:hidden;border:1px solid #dbe4ef;border-radius:10px;aspect-ratio:1}.image-preview img,.image-preview :deep(.product-image){width:100%;height:100%;object-fit:cover}.image-preview button{position:absolute;right:4px;bottom:4px;padding:2px 7px;border:0;border-radius:5px;background:rgb(15 23 42 / 72%);color:#fff;cursor:pointer}.upload-copy{align-items:center;gap:5px}.upload-copy span{color:#8492a6;font-size:12px}.drawer-footer{display:flex;align-items:center;justify-content:space-between;color:#8492a6;font-size:12px}.drawer-footer>div{display:flex;gap:10px}@media(max-width:639px){.drawer-content{padding:12px}.form-section{padding:16px}.form-grid{grid-template-columns:1fr}.field--full{grid-column:auto}.image-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
