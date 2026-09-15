<script setup lang="ts">
import { shallowRef } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { qrManagementStatusMap } from '@/api/qr-management'
import type { QrManagementItem } from '@/api/qr-management'
import QrManagementDetailDrawer from './QrManagementDetailDrawer.vue'

defineProps<{
  items: QrManagementItem[]; loading: boolean; total: number; page: number; pageSize: number
  canCreate: boolean; canEdit: boolean
}>()
const emit = defineEmits<{ bind: [item: QrManagementItem]; page: [page: number, pageSize: number]; refresh: [] }>()
const columns = [
  { title: '二维码ID', key: 'code', width: 200 },
  { title: '校服产品', key: 'product', width: 150 },
  { title: '学校', dataIndex: 'schoolName', key: 'schoolName', width: 130 },
  { title: '学生', key: 'student', width: 110 },
  { title: '家长', key: 'parent', width: 130 },
  { title: '扫码次数', dataIndex: 'scanCount', key: 'scanCount', width: 90 },
  { title: '状态', key: 'status', width: 110 },
  { title: '操作', key: 'actions', width: 190, fixed: 'right' as const },
]
const selected = shallowRef<QrManagementItem | null>(null)
const tab = shallowRef('detail')
function inspect(item: QrManagementItem, activeTab: string) {
  selected.value = item
  tab.value = activeTab
}
</script>

<template>
  <div class="qr-results">
    <header class="qr-results__header"><h3>二维码列表</h3><span>共 {{ total.toLocaleString() }} 条</span></header>
    <a-table :columns="columns" :data-source="items" row-key="id" :loading="loading" :scroll="{ x: 1110 }"
      :pagination="false" :locale="{ emptyText: '暂无符合条件的二维码' }">
      <template #bodyCell="{ column, record }">
        <a-button v-if="column.key === 'code'" class="qr-code" type="link" @click="inspect(record as QrManagementItem, 'detail')">{{ record.code }}</a-button>
        <template v-else-if="column.key === 'product'">
          <div>{{ record.productName || '—' }}</div>
          <div class="secondary">
            {{ record.productCode || '—' }} / {{ record.productSizes?.join('、').toUpperCase() || '—' }}
          </div>
        </template>
        <template v-else-if="column.key === 'student'">
          <strong>{{ record.studentName || '未绑定' }}</strong><div class="secondary">{{ [record.grade, record.className].filter(Boolean).join(' ') || '—' }}</div>
        </template>
        <template v-else-if="column.key === 'parent'">
          <div>{{ record.parentName || '未绑定' }}</div><div class="secondary">{{ record.phoneMasked || '—' }}</div>
        </template>
        <template v-else-if="column.key === 'schoolName'">{{ record.schoolName || '—' }}</template>
        <StatusTag v-else-if="column.key === 'status'" :value="record.status" :map="qrManagementStatusMap" />
        <a-space v-else-if="column.key === 'actions'" :size="8">
          <a-button type="link" size="small" @click="inspect(record as QrManagementItem, 'detail')">详情</a-button>
          <a-button type="link" size="small" @click="inspect(record as QrManagementItem, 'records')">记录</a-button>
          <a-button v-if="record.qrStatus !== 'voided' && !record.disabled && (record.version ? canEdit : canCreate)" type="link" size="small"
            @click="emit('bind', record as QrManagementItem)">{{ record.version ? '编辑绑定' : '绑定学生' }}</a-button>
        </a-space>
      </template>
    </a-table>
    <div v-if="total" class="qr-results__pagination">
      <a-pagination :current="page" :page-size="pageSize" :total="total" :disabled="loading"
        show-size-changer :page-size-options="['10', '20', '50']" @change="(next, size) => emit('page', next, size)" />
    </div>
  </div>

  <QrManagementDetailDrawer v-if="selected" :key="selected.id" :id="selected.id" :initial-tab="tab" :can-edit="canEdit"
    @close="selected = null" @changed="emit('refresh')" />
</template>

<style scoped>
.qr-results { min-width: 0; overflow: hidden; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
.qr-results__header { display: flex; align-items: center; justify-content: space-between; padding: 18px; }
.qr-results__header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.qr-results__header span, .secondary { color: #8492a8; font-size: 12px; }
.secondary { margin-top: 4px; }
.qr-code { height: auto; padding: 0; font-size: 12px; text-align: left; white-space: normal; overflow-wrap: anywhere; }
.qr-results__pagination { display: flex; justify-content: flex-end; padding: 16px; }
.qr-results :deep(.ant-table-thead > tr > th) { background: #f8fafc; color: #64748b; font-size: 12px; }
.qr-results :deep(.ant-table-cell) { font-size: 13px; }
</style>
