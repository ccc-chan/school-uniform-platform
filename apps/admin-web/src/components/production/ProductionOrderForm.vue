<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import type { Company } from '@/api/companies'
import type { ProductionInput, ProductionItem } from '@/api/production'
import type { Product } from '@/api/products'

const props = defineProps<{ open: boolean; item: ProductionItem | null; saving: boolean }>()
const emit = defineEmits<{ close: []; submit: [value: ProductionInput] }>()
const productModalOpen = shallowRef(false)
const companyModalOpen = shallowRef(false)
const form = reactive({ productId: 0, productName: '', productCode: '', companyId: 0, companyName: '', sizes: [] as string[], status: 'pending', notes: '' })
const sizeOptions = Array.from({ length: 17 }, (_, index) => { const value = String(120 + index * 5); return { label: `${value}码`, value } })
const statusOptions = [{ label: '待生产', value: 'pending' }, { label: '生产中', value: 'producing' }, { label: '已完工', value: 'completed' }, { label: '已入库', value: 'warehoused' }]
watch(() => [props.open, props.item] as const, () => { if (!props.open) return; Object.assign(form, { productId: props.item?.productId || 0, productName: props.item?.productName || '', productCode: props.item?.productCode || '', companyId: props.item?.companyId || 0, companyName: props.item?.companyName || '', sizes: [...(props.item?.sizes || [])], status: props.item?.status || 'pending', notes: props.item?.notes || '' }) }, { immediate: true })
function selectProduct(product: Product) { Object.assign(form, { productId: product.id, productName: product.name || '', productCode: product.code || '' }); productModalOpen.value = false }
function selectCompany(company: Company) { Object.assign(form, { companyId: company.id, companyName: company.name }); companyModalOpen.value = false }
function submit() { if (!form.productId) return message.warning('请选择关联产品'); if (!form.companyId) return message.warning('请选择关联企业'); if (!form.sizes.length) return message.warning('请选择型号尺码'); emit('submit', { productId: form.productId, companyId: form.companyId, sizes: [...form.sizes], status: form.status, notes: form.notes }) }
</script>

<template>
  <a-drawer :open="open" :title="item ? '编辑工单计划' : '新增工单计划'" :width="640" @close="emit('close')">
    <a-form layout="vertical"><a-form-item label="工单号"><a-input :value="item?.orderNo || '保存后系统自动生成'" disabled /></a-form-item>
      <a-form-item label="关联产品" required><a-input-group compact><a-input :value="form.productId ? `${form.productCode} · ${form.productName}` : ''" readonly placeholder="请选择关联产品" style="width:calc(100% - 96px)" /><a-button style="width:96px" @click="productModalOpen = true">选择产品</a-button></a-input-group></a-form-item>
      <a-form-item label="型号尺码" required><a-select v-model:value="form.sizes" mode="multiple" :options="sizeOptions" placeholder="可多选" /></a-form-item>
      <a-form-item label="关联企业" required><a-input-group compact><a-input :value="form.companyName" readonly placeholder="请选择关联企业" style="width:calc(100% - 96px)" /><a-button style="width:96px" @click="companyModalOpen = true">选择企业</a-button></a-input-group></a-form-item>
      <a-form-item label="状态"><a-select v-model:value="form.status" :options="statusOptions" /></a-form-item><a-form-item label="备注"><a-textarea v-model:value="form.notes" :rows="4" :maxlength="500" show-count /></a-form-item>
    </a-form>
    <template #footer><div class="drawer-footer"><a-button @click="emit('close')">取消</a-button><a-button type="primary" :loading="saving" @click="submit">保存</a-button></div></template>
    <ProductSelectModal :open="productModalOpen" :selected-id="form.productId" @close="productModalOpen = false" @select="selectProduct" /><CompanySelectModal :open="companyModalOpen" :selected-id="form.companyId" @close="companyModalOpen = false" @select="selectCompany" />
  </a-drawer>
</template>

<style scoped>.drawer-footer{display:flex;justify-content:flex-end;gap:10px}</style>
