<script setup lang="ts">
import QrBatchImportWizard from '@/components/qrcodes/QrBatchImportWizard.vue'

const router = useRouter()
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div>
      <h2 class="page-title">批量生成二维码</h2>
      <p class="mb-0 mt-2 text-secondary">通过 Excel 一次创建多个产品的二维码批次</p>
    </div>
    <QrBatchImportWizard
      @cancel="router.push('/qrcodes')"
      @success="router.push('/qrcodes')"
    />
  </section>
</template>
