<script setup lang="ts">
import { getProductImage } from '@/api/products'
const props = withDefaults(defineProps<{ fileId?: number | null; variant?: 'thumbnail' | 'card' }>(), { fileId: null, variant: 'thumbnail' })
const url = shallowRef(''); const loading = shallowRef(false); const failed = shallowRef(false)
watch(() => props.fileId, async (fileId, _previous, onCleanup) => { let active = true; onCleanup(() => { active = false }); if (url.value) URL.revokeObjectURL(url.value); url.value = ''; failed.value = false; if (!fileId) return; loading.value = true; try { const objectUrl = URL.createObjectURL(await getProductImage(fileId)); if (active) url.value = objectUrl; else URL.revokeObjectURL(objectUrl) } catch { if (active) failed.value = true } finally { if (active) loading.value = false } }, { immediate: true })
onBeforeUnmount(() => { if (url.value) URL.revokeObjectURL(url.value) })
</script>
<template><div class="product-image" :class="{ 'product-image--thumbnail':variant==='thumbnail','product-image--card':variant==='card' }"><a-spin v-if="loading" size="small"/><img v-else-if="url" :src="url" alt="产品图片" class="product-image__content"/><span v-else class="product-image__empty">{{ failed?'加载失败':'暂无图片' }}</span></div></template>
<style scoped>
.product-image{display:flex;flex:none;align-items:center;justify-content:center;overflow:hidden;border:1px solid #edf1f6;background:#f8fafc}.product-image--thumbnail{width:48px;height:48px;border-radius:8px}.product-image--card{width:104px;height:96px;border-radius:12px}.product-image__content{width:100%;height:100%;object-fit:cover}.product-image__empty{padding:8px;color:#94a3b8;font-size:11px;text-align:center}@media(max-width:479px){.product-image--card{width:88px;height:88px}}
</style>
