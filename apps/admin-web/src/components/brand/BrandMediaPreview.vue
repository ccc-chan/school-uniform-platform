<script setup lang="ts">
import { getBrandMedia } from '@/api/brand'

const props = withDefaults(defineProps<{
  fileId?: number | null
  kind?: 'image' | 'video'
  alt?: string
}>(), {
  fileId: null,
  kind: 'image',
  alt: '品牌媒体',
})

const objectUrl = shallowRef('')
const loading = shallowRef(false)
const failed = shallowRef(false)
let requestVersion = 0

function releaseUrl() {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = ''
}

watch(
  () => props.fileId,
  async (id) => {
    const version = ++requestVersion
    releaseUrl()
    failed.value = false
    if (!id) return
    loading.value = true
    try {
      const blob = await getBrandMedia(id)
      if (version !== requestVersion) return
      objectUrl.value = URL.createObjectURL(blob)
    } catch {
      if (version === requestVersion) failed.value = true
    } finally {
      if (version === requestVersion) loading.value = false
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  requestVersion += 1
  releaseUrl()
})
</script>

<template>
  <div class="brand-media-preview">
    <a-spin v-if="loading" size="small" />
    <video
      v-else-if="objectUrl && kind === 'video'"
      :src="objectUrl"
      class="h-full w-full object-cover"
      controls
      preload="metadata"
    />
    <img
      v-else-if="objectUrl"
      :src="objectUrl"
      :alt="alt"
      class="h-full w-full object-cover"
    />
    <span v-else class="px-2 text-center text-xs text-slate-400">
      {{ failed ? '加载失败' : '暂无媒体' }}
    </span>
  </div>
</template>

<style scoped>
.brand-media-preview {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f1f5f9;
}
</style>
