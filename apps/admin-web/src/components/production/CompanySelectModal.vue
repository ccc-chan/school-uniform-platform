<script setup lang="ts">
import { getCompanyOptions, type Company } from '@/api/companies'
import message from 'ant-design-vue/es/message'

const props = defineProps<{ open: boolean; selectedId?: number | null }>()
const emit = defineEmits<{ close: []; select: [company: Company] }>()
const keyword = shallowRef('')
const loading = shallowRef(false)
const items = shallowRef<Company[]>([])
const visibleItems = computed(() => { const value = keyword.value.trim().toLowerCase(); return value ? items.value.filter(item => item.name.toLowerCase().includes(value) || item.code.toLowerCase().includes(value)) : items.value })
async function load() { loading.value = true; try { items.value = (await getCompanyOptions()).filter(item => item.status === 'enabled') } catch (error) { message.error(error instanceof Error ? error.message : '企业加载失败') } finally { loading.value = false } }
watch(() => props.open, value => { if (value) void load() })
</script>

<template>
  <a-modal :open="open" title="选择关联企业" :width="720" :footer="null" @cancel="emit('close')">
    <a-input v-model:value="keyword" allow-clear class="company-search" placeholder="搜索企业名称 / 编码" />
    <a-table :data-source="visibleItems" :loading="loading" :pagination="false" row-key="id" :scroll="{ y: 420 }"><a-table-column title="企业编码" data-index="code" /><a-table-column title="企业名称" data-index="name" /><a-table-column title="品牌" data-index="brandName" /><a-table-column title="操作" key="action" :width="90"><template #default="{ record }"><a-button type="link" :disabled="record.id === selectedId" @click="emit('select', record)">{{ record.id === selectedId ? '已选' : '选择' }}</a-button></template></a-table-column></a-table>
  </a-modal>
</template>

<style scoped>.company-search{margin-bottom:16px}</style>
