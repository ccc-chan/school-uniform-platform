<script setup lang="ts">
import { computed } from 'vue'
import BatchCodeHome from '@/components/trace/BatchCodeHome.vue'
import ProductCodeHome from '@/components/trace/ProductCodeHome.vue'
import SchoolCodeHome from '@/components/trace/SchoolCodeHome.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { qrCodeType } = useSchoolUniformInfoViewModel()

const pageComponent = computed(() => {
  if (qrCodeType.value === 'batch') return BatchCodeHome
  if (qrCodeType.value === 'school') return SchoolCodeHome
  return ProductCodeHome
})
</script>

<template>
  <component :is="pageComponent" />
</template>
