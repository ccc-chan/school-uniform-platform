<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import type { ProductionInput, ProductionItem, ProductionOrderFilters } from '@/api/production'
import { useProductionResource } from '@/composables/useProductionResource'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/utils/modal'

const router = useRouter()
const auth = useAuthStore()
const editorOpen = shallowRef(false)
const editing = shallowRef<ProductionItem | null>(null)
const saving = shallowRef(false)
const batchEditorOpen = shallowRef(false)
const batchOrder = shallowRef<ProductionItem | null>(null)
const { items, loading, total, page, pageSize, filters, load, setFilters, search, reset, setPage, save, remove } = useProductionResource('orders')
const has = (code: string) => auth.hasPermission(code)
const safe = async (action: () => Promise<void>, fallback: string) => { try { await action() } catch (error) { message.error(error instanceof Error ? error.message : fallback) } }
function openEditor(item: ProductionItem | null = null) { editing.value = item; editorOpen.value = true }
function closeEditor() { editorOpen.value = false; editing.value = null }
function openBatchEditor(item: ProductionItem) { batchOrder.value = item; batchEditorOpen.value = true }
function closeBatchEditor() { batchEditorOpen.value = false; batchOrder.value = null }
async function batchCreated() { closeBatchEditor(); await safe(load, '工单数据刷新失败') }
async function submit(value: ProductionInput) { saving.value = true; try { await save(editing.value?.id || null, value); message.success(editing.value ? '工单已更新' : '工单已创建'); closeEditor() } catch (error) { message.error(error instanceof Error ? error.message : '工单保存失败') } finally { saving.value = false } }
function trace(item: ProductionItem) { if (item.productId) void router.push(`/products/${item.productId}`) }
function detail(item: ProductionItem) { if (item.productId) void router.push(`/products/${item.productId}`) }
function destroy(item: ProductionItem) { confirmAction({ title: '确认删除工单', content: `确定删除工单“${item.orderNo}”吗？`, okType: 'danger', async onOk() { try { await remove(item.id); message.success('工单已删除') } catch (error) { message.error(error instanceof Error ? error.message : '工单删除失败'); throw error } } }) }
onMounted(() => safe(load, '工单数据加载失败'))
</script>

<template>
  <section class="production-page">
    <header class="production-page__header"><div><h2 class="page-title">生产管理</h2><p>统一管理生产工单、批次与质检追溯</p></div><a-button v-if="has('production.order.create')" type="primary" @click="openEditor()">＋ 新增工单计划</a-button></header>
    <div class="production-page__card"><ProductionFilters :filters="filters as ProductionOrderFilters" :loading="loading" @update:filters="setFilters" @search="safe(search, '查询失败')" @reset="safe(reset, '重置失败')" /></div>
    <ProductionTable :items="items" :loading="loading" :can-edit="has('production.order.edit')" :can-delete="has('delete')" :can-manage-batch="has('production.batch.manage')" @detail="detail" @edit="openEditor" @delete="destroy" @trace="trace" @create-batch="openBatchEditor" />
    <div v-if="total" class="production-page__pagination"><span>共 {{ total }} 个工单</span><a-pagination :current="page" :page-size="pageSize" :total="total" @change="(value: number) => safe(() => setPage(value), '加载失败')" /></div>
    <ProductionOrderForm :open="editorOpen" :item="editing" :saving="saving" @close="closeEditor" @submit="submit" />
    <ProductionBatchCreateDrawer :open="batchEditorOpen" :order="batchOrder" @close="closeBatchEditor" @created="batchCreated" />
  </section>
</template>

<style scoped>
.production-page{display:flex;width:100%;max-width:1800px;margin:0 auto;padding-bottom:16px;flex-direction:column;gap:18px}.production-page__header{display:flex;align-items:center;justify-content:space-between;gap:20px}.production-page__header p{margin:6px 0 0;color:#7c8da5;font-size:13px}.production-page__card{padding:16px;border:1px solid #dce5f1;border-radius:16px;background:#fff}.production-page__pagination{display:flex;align-items:center;justify-content:space-between;color:#64748b;font-size:13px}@media(max-width:639px){.production-page__header,.production-page__pagination{align-items:flex-start;flex-direction:column}}
</style>
