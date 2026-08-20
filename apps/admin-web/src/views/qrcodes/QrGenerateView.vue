<script setup lang="ts">
import { message } from 'ant-design-vue'
import QrGenerationWizard from '@/components/qrcodes/QrGenerationWizard.vue'
import { useQrOptions } from '@/composables/useQrOptions'

const router = useRouter()
const { products, loadingProducts, loadProducts } = useQrOptions()

onMounted(async () => {
  try {
    await loadProducts()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '产品选项加载失败')
  }
})
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div>
      <h2 class="page-title">生成二维码</h2>
      <p class="mb-0 mt-2 text-secondary">为指定产品创建唯一二维码编号</p>
    </div>
    <QrGenerationWizard
      :products="products"
      :loading-products="loadingProducts"
      @cancel="router.push('/qrcodes')"
      @success="router.push('/qrcodes')"
    />
  </section>
</template>
