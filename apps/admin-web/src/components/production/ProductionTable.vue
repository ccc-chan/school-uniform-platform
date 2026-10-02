<script setup lang="ts">
import type { ProductionItem } from '@/api/production'
import { productCategoryOptions, productQrCodeTypeOptions } from '@/api/products'

defineProps<{ items: readonly ProductionItem[]; loading: boolean; canEdit: boolean; canDelete: boolean; canChangeStatus: boolean; canManageBatch: boolean }>()
const emit = defineEmits<{ detail: [item: ProductionItem]; edit: [item: ProductionItem]; delete: [item: ProductionItem]; trace: [item: ProductionItem]; createBatch: [item: ProductionItem]; status: [value: { item: ProductionItem; status: string }] }>()
const categoryLabels = Object.fromEntries(productCategoryOptions.map(item => [item.value, item.label]))
const qrLabels = Object.fromEntries(productQrCodeTypeOptions.map(item => [item.value, item.label]))
const statusOptions = [{ label: '待生产', value: 'pending' }, { label: '生产中', value: 'producing' }, { label: '已完工', value: 'completed' }, { label: '已入库', value: 'warehoused' }]
const qualityLabels: Record<string, string> = { qualified: '合格', unqualified: '不合格', missing: '无报告' }
const inspectionLabels: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回', expired: '已过期', missing: '未检验' }
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading && !items.length" description="暂无生产工单" />
    <div v-else class="production-table-wrap"><table class="production-table">
      <thead><tr><th>工单号</th><th>产品图</th><th>名称</th><th>款号</th><th>类型</th><th>安全类别</th><th>执行标准</th><th>纤维成分摘要</th><th>质检状态</th><th>生产数量</th><th>检验状态</th><th>流程追溯</th><th>状态</th><th>操作</th></tr></thead>
      <tbody><tr v-for="item in items" :key="item.id">
        <td><code>{{ item.orderNo }}</code></td><td><ProductImage v-if="item.productImageId" :file-id="item.productImageId" variant="card" /><span v-else>—</span></td>
        <td><strong>{{ item.productName || '—' }}</strong><div class="subtext">{{ item.companyName || '—' }}</div></td><td>{{ item.productCode || '—' }}</td>
        <td>{{ categoryLabels[item.category || ''] || '—' }}<div class="subtext">{{ qrLabels[item.qrCodeType || ''] || '' }}</div></td><td><span class="line-clamp">{{ item.safetyCategory || '—' }}</span></td><td><span class="line-clamp">{{ item.executionStandard || '—' }}</span></td><td><span class="line-clamp">{{ item.fabricSummary || '—' }}</span></td>
        <td><a-tag :color="item.qualityStatus === 'qualified' ? 'green' : item.qualityStatus === 'unqualified' ? 'red' : 'default'">{{ qualityLabels[item.qualityStatus || 'missing'] || item.qualityStatus }}</a-tag></td>
        <td><strong>{{ Number(item.productionQuantity || 0).toLocaleString('zh-CN') }}</strong> 件<div class="subtext">{{ item.batchCount || 0 }} 个批次</div></td><td>{{ inspectionLabels[item.inspectionStatus || 'missing'] || item.inspectionStatus }}</td>
        <td><a-button type="link" size="small" @click="emit('trace', item)">查看追溯</a-button></td><td><a-select v-if="canChangeStatus" :value="item.status" :options="statusOptions" size="small" class="status-select" @change="emit('status', { item, status: String($event) })" /><span v-else>{{ statusOptions.find(option => option.value === item.status)?.label || '—' }}</span></td><td><div class="actions"><a-button v-if="canManageBatch" type="link" size="small" @click="emit('createBatch', item)">新增批次</a-button><a-button type="link" size="small" @click="emit('detail', item)">详情</a-button><a-button v-if="canEdit" type="link" size="small" @click="emit('edit', item)">编辑</a-button><a-button v-if="canDelete" type="link" danger size="small" @click="emit('delete', item)">删除</a-button></div></td>
      </tr></tbody>
    </table></div>
  </a-spin>
</template>

<style scoped>
.production-table-wrap{overflow:auto;border:1px solid #dfe7f1;border-radius:16px;background:#fff}.production-table{width:100%;min-width:2180px;border-collapse:collapse}.production-table th,.production-table td{padding:13px 14px;border-bottom:1px solid #edf1f6;text-align:left;vertical-align:middle}.production-table th{background:#f8fafc;color:#64748b;font-size:13px;font-weight:600;white-space:nowrap}.production-table tbody tr:hover{background:#f8fbff}.production-table :deep(.product-image--card){width:54px;height:54px;border-radius:9px;object-fit:cover}.production-table code{padding:3px 7px;border-radius:6px;background:#eef4ff;color:#315f9f}.subtext{margin-top:3px;color:#94a3b8;font-size:12px}.line-clamp{display:-webkit-box;max-width:220px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2}.status-select{width:104px}.actions{display:flex;align-items:center;white-space:nowrap}
</style>
