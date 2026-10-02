<script setup lang="ts">
import { getProducts, type Product } from '@/api/products'
import message from 'ant-design-vue/es/message'

const props = defineProps<{ open: boolean; selectedId?: number | null }>()
const emit = defineEmits<{ close: []; select: [product: Product] }>()
const keyword = shallowRef('')
const loading = shallowRef(false)
const items = shallowRef<Product[]>([])
async function load() { loading.value = true; try { const result = await getProducts({ page: 1, pageSize: 100, keyword: keyword.value, status: 'enabled' }); items.value = result.items } catch (error) { message.error(error instanceof Error ? error.message : '产品加载失败') } finally { loading.value = false } }
watch(() => props.open, value => { if (value) void load() })
</script>

<template>
  <a-modal :open="open" title="选择关联产品" :width="780" :footer="null" @cancel="emit('close')">
    <div class="selector-search"><a-input v-model:value="keyword" allow-clear placeholder="搜索产品名称 / 编号" @press-enter="load" /><a-button type="primary" :loading="loading" @click="load">查询</a-button></div>
    <a-table :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ y: 420 }">
      <a-table-column title="产品图" key="image" :width="86"><template #default="{ record }"><ProductImage v-if="record.imageId" :file-id="record.imageId" variant="thumbnail" /><span v-else>—</span></template></a-table-column>
      <a-table-column title="款号" data-index="code" /><a-table-column title="产品名称" data-index="name" />
      <a-table-column title="操作" key="action" :width="90"><template #default="{ record }"><a-button type="link" :disabled="record.id === selectedId" @click="emit('select', record)">{{ record.id === selectedId ? '已选' : '选择' }}</a-button></template></a-table-column>
    </a-table>
  </a-modal>
</template>

<style scoped>
.selector-search{display:flex;gap:10px;margin-bottom:16px}
</style>
