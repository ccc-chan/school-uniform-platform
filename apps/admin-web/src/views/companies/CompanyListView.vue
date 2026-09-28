<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import type { Company } from '@/api/companies'
import { useCompanies } from '@/composables/useCompanies'
import { useAuthStore } from '@/stores/auth'
import { confirmAction, confirmDisable } from '@/utils/modal'

const auth = useAuthStore()
const editorOpen = shallowRef(false)
const editing = shallowRef<Company | null>(null)
const { items, loading, total, page, pageSize, filters, load, setFilters, search, reset, setPage, toggleStatus, remove } = useCompanies()
const has = (code: string) => auth.hasPermission(code)
const tableItems = computed(() => [...items.value])
const safe = async (action: () => Promise<void>, fallback: string) => { try { await action() } catch (error) { message.error(error instanceof Error ? error.message : fallback) } }
function openEditor(item: Company | null = null) { editing.value = item; editorOpen.value = true }
function closeEditor() { editorOpen.value = false; editing.value = null }
async function saved() { closeEditor(); await safe(load, '公司列表刷新失败') }
const toggle = (item: Company) => safe(async () => { if (item.status === 'enabled' && !(await confirmDisable(`公司“${item.name}”`))) return; await toggleStatus(item); message.success('公司状态已更新') }, '状态更新失败')
const destroy = (item: Company) => confirmAction({ title: '确认删除公司', content: `确定删除“${item.name}”吗？`, okType: 'danger', async onOk() { await remove(item); message.success('公司已删除') } })
onMounted(() => safe(load, '公司数据加载失败'))
</script>

<template>
  <section class="company-page">
    <header class="company-page__header"><div><h2 class="page-title">公司管理</h2><p>维护产品所属管理公司及企业资质信息</p></div><a-button v-if="has('create')" type="primary" @click="openEditor()">＋ 新增公司</a-button></header>
    <div class="company-page__card"><CompanyFilters :filters="filters" :loading="loading" @update:filters="setFilters" @search="safe(search, '查询失败')" @reset="safe(reset, '重置失败')" /></div>
    <div class="company-page__card"><CompanyTable :items="tableItems" :loading="loading" :can-edit="has('edit')" :can-delete="has('delete')" @edit="openEditor" @toggle="toggle" @delete="destroy" /><div v-if="total" class="company-page__pagination"><span>共 {{ total }} 家公司</span><a-pagination :current="page" :page-size="pageSize" :total="total" @change="value => safe(() => setPage(value), '加载失败')" /></div></div>
    <CompanyEditorDrawer :open="editorOpen" :company="editing" @close="closeEditor" @saved="saved" />
  </section>
</template>

<style scoped>.company-page{display:flex;max-width:1600px;margin:0 auto;flex-direction:column;gap:18px}.company-page__header{display:flex;align-items:center;justify-content:space-between;gap:20px}.company-page__header p{margin:6px 0 0;color:#7c8da5;font-size:13px}.company-page__card{padding:16px;border:1px solid #dce5f1;border-radius:16px;background:#fff}.company-page__pagination{display:flex;align-items:center;justify-content:space-between;margin-top:18px;color:#64748b;font-size:13px}</style>
