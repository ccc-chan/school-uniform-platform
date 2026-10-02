<script setup lang="ts">
import { getCompanyLogo } from '@/api/companies'

const props = defineProps<{
  companyId: number
  brandName: string
  hasLogo: boolean
}>()

const url = shallowRef('')
const loading = shallowRef(false)
const failed = shallowRef(false)

watch(
  () => [props.companyId, props.hasLogo] as const,
  async ([companyId, hasLogo], _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })

    if (url.value) URL.revokeObjectURL(url.value)
    url.value = ''
    failed.value = false

    if (!hasLogo) return

    loading.value = true
    try {
      const objectUrl = URL.createObjectURL(await getCompanyLogo(companyId))
      if (active) url.value = objectUrl
      else URL.revokeObjectURL(objectUrl)
    } catch {
      if (active) failed.value = true
    } finally {
      if (active) loading.value = false
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
})
</script>

<template>
  <span class="company-logo">
    <a-spin v-if="loading" size="small" />
    <img
      v-else-if="url"
      :src="url"
      :alt="`${brandName || '企业'}品牌 Logo`"
    />
    <span v-else class="company-logo__fallback">
      {{ failed ? '!' : brandName?.slice(0, 1) || '企' }}
    </span>
  </span>
</template>

<style scoped>
.company-logo {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  overflow: hidden;
  place-items: center;
  border: 1px solid #e2e8f2;
  border-radius: 10px;
  background: #f5f8fc;
}

.company-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.company-logo__fallback {
  color: #718198;
  font-size: 13px;
  font-weight: 700;
}
</style>
