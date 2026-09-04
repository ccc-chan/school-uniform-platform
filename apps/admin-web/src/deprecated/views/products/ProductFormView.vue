<!--
 * @Author: Chan
 * @Date: 2026-07-17 09:24:26
 * @LastEditors: chan
 * @LastEditTime: 2026-08-20 16:28:50
 * @FilePath: /school-uniform-platform/apps/admin-web/src/views/products/ProductFormView.vue
 * @Description: 
 * 
-->
<script setup lang="ts">
import { message } from 'ant-design-vue'
import { getProduct, updateProduct, type ProductInput } from '@/api/products'
const route = useRoute(),
  router = useRouter(),
  id = computed(() => Number(route.params.id || 0)),
  saving = shallowRef(false),
  existingImageId = shallowRef<number | null>(null)
const form = reactive<ProductInput>({
  name: '',
  code: '',
  category: 'sports_set',
  qrCodeType: 'product',
  applicableSchools: [],
  season: 'all_season',
  style: '',
  color: '',
  sizes: [],
  fabricInfo: '',
  executionStandard: '',
  washingInstructions: '',
  image: null,
})
const model = computed({
  get: () => ({ ...form }),
  set: (value) => Object.assign(form, value),
})
async function load() {
  if (!id.value) return
  try {
    const item = await getProduct(id.value)
    Object.assign(form, item, { image: null })
    existingImageId.value = item.imageId || null
  } catch (e) {
    message.error(e instanceof Error ? e.message : '产品加载失败')
  }
}
async function submit() {
  if (
    !form.name.trim() ||
    !form.code.trim() ||
    (!form.image && !existingImageId.value)
  ) {
    message.warning('请完整填写必填信息并上传产品图片')
    return
  }
  saving.value = true
  try {
    await updateProduct(id.value, { ...form })
    message.success('产品已更新')
    await router.push('/products')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
<template>
  <section class="mx-auto max-w-300">
    <div class="page-card">
      <div class="mb-6">
        <h2 class="page-title">编辑产品</h2>
        <p class="mb-0 mt-2 text-secondary">填写产品基础信息、规格与执行标准</p>
      </div>
      <ProductForm
        v-model="model"
        :saving="saving"
        :existing-image-id="existingImageId"
        @submit="submit"
        @cancel="router.push('/products')"
      />
    </div>
  </section>
</template>
