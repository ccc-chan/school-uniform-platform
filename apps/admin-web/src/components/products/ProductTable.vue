<script setup lang="ts">
import { productCategoryOptions, productSchoolStageOptions, type Product } from '@/api/products'

const props = defineProps<{ items: readonly Product[]; loading: boolean; permissions: readonly string[]; canEdit: boolean; canStatus: boolean; canDelete: boolean }>()
const emit = defineEmits<{ view: [product: Product]; edit: [product: Product]; toggle: [product: Product]; delete: [product: Product] }>()
const categoryLabels = Object.fromEntries(productCategoryOptions.map((item) => [item.value, item.label]))
const schoolStageLabels = Object.fromEntries(productSchoolStageOptions.map((item) => [item.value, item.label]))
const hasPermission = (code: string) => props.permissions.includes(code) || ((code.endsWith('.view') || code.includes('.field.')) && props.permissions.includes('view'))
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading && !items.length" description="暂无产品，点击“新建产品”开始录入" />
    <div v-else class="product-table-wrap">
      <table class="product-table">
        <thead><tr><th>产品图</th><th>名称</th><th>产品编码</th><th>学段年级</th><th>类型</th><th class="actions-heading">操作</th></tr></thead>
        <tbody>
          <tr v-for="product in items" :key="product.id">
            <td><ProductImage v-if="hasPermission('product.field.image') && product.imageId" :file-id="product.imageId" variant="card" /><span v-else>-</span></td>
            <td>{{ hasPermission('product.field.name') ? product.name || '-' : '-' }}</td>
            <td><code>{{ hasPermission('product.field.code') ? product.code || '-' : '-' }}</code></td>
            <td>{{ schoolStageLabels[product.schoolStage || ''] || '-' }}</td>
            <td>{{ hasPermission('product.field.category') ? categoryLabels[product.category || ''] || '-' : '-' }}</td>
            <td><div class="actions"><a-button type="link" size="small" @click="emit('view', product)">详情</a-button><a-button v-if="canEdit" type="link" size="small" @click="emit('edit', product)">编辑</a-button><a-button v-if="canStatus" type="link" size="small" @click="emit('toggle', product)">{{ product.status === 'enabled' ? '停用' : '启用' }}</a-button><a-button v-if="canDelete" type="link" size="small" danger @click="emit('delete', product)">删除</a-button></div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-spin>
</template>

<style scoped>
.product-table-wrap{overflow:auto;border:1px solid #dfe7f1;border-radius:16px;background:#fff}.product-table{width:100%;min-width:820px;border-collapse:collapse}.product-table th,.product-table td{padding:14px 16px;border-bottom:1px solid #edf1f6;text-align:left;vertical-align:middle}.product-table th{background:#f8fafc;color:#64748b;font-size:13px;font-weight:600}.product-table tbody tr:last-child td{border-bottom:0}.product-table tbody tr:hover{background:#f8fbff}.product-table td:first-child{width:92px}.product-table :deep(.product-image--card){width:64px;height:64px;border-radius:10px;object-fit:cover}.product-table code{padding:3px 7px;border-radius:6px;background:#eef4ff;color:#315f9f}.actions-heading{text-align:right!important}.actions{display:flex;justify-content:flex-end;white-space:nowrap}
</style>
