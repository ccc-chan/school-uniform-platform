<!--
 * @Author: Chan
 * @Date: 2026-09-15 14:05:43
 * @LastEditors: chan
 * @LastEditTime: 2026-09-16 14:32:12
 * @FilePath: /school-uniform-platform/apps/admin-web/src/features/qrcodes/management/QrManagementTable.vue
 * @Description: 
 * 
-->
<script setup lang="ts">
import { shallowRef } from 'vue'
import ConfigTable from '@/components/common/ConfigTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { qrManagementStatusMap } from '@/api/qr-management'
import type { QrManagementItem } from '@/api/qr-management'
import QrManagementDetailDrawer from './QrManagementDetailDrawer.vue'
import { tableColumns } from './config'

defineProps<{
  items: readonly QrManagementItem[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  canCreate: boolean
  canEdit: boolean
}>()
const emit = defineEmits<{
  bind: [item: QrManagementItem]
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
  page: [page: number, pageSize: number]
  refresh: []
}>()

const selected = shallowRef<QrManagementItem | null>(null)
const tab = shallowRef('detail')
function inspect(item: QrManagementItem, activeTab: string) {
  selected.value = item
  tab.value = activeTab
}
</script>

<template>
  <div class="qr-results">
    <header class="qr-results__header">
      <h3>二维码列表</h3>
      <span>共 {{ total.toLocaleString() }} 条</span>
    </header>
    <ConfigTable
      :columns="tableColumns"
      :items="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="loading"
      :scroll-x="1110"
      :total="total"
      :page="page"
      :page-size="pageSize"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
      @change="(next, size) => emit('page', next, size)"
    >
      <template #empty>
        <a-empty description="暂无符合条件的二维码" />
      </template>
      <template #cell="{ column, record }">
        <a-button
          v-if="column.key === 'code'"
          class="qr-code"
          type="link"
          @click="inspect(record as QrManagementItem, 'detail')"
          >{{ record.code }}</a-button
        >
        <template v-else-if="column.key === 'product'">
          <div>{{ record.productName || '—' }}</div>
          <div class="secondary">
            {{ record.productCode || '—' }} /
            {{
              (record.productSizes as string[])?.join('、').toUpperCase() || '—'
            }}
          </div>
        </template>
        <template v-else-if="column.key === 'student'">
          <strong>{{ record.studentName || '未绑定' }}</strong>
          <div class="secondary">
            {{
              [record.grade, record.className].filter(Boolean).join(' ') || '—'
            }}
          </div>
        </template>
        <template v-else-if="column.key === 'parent'">
          <div>{{ record.parentName || '未绑定' }}</div>
          <div class="secondary">{{ record.phoneMasked || '—' }}</div>
        </template>
        <template v-else-if="column.key === 'schoolName'">{{
          record.schoolName || '—'
        }}</template>
        <StatusTag
          v-else-if="column.key === 'status'"
          :value="
            record.studentName || record.status === 'bound'
              ? 'bound'
              : 'unbound'
          "
          :map="qrManagementStatusMap"
        />
        <a-space v-else-if="column.key === 'actions'" :size="8">
          <a-button
            type="link"
            size="small"
            @click="inspect(record as QrManagementItem, 'detail')"
            >详情</a-button
          >
          <!-- <a-button
            type="link"
            size="small"
            @click="inspect(record as QrManagementItem, 'records')"
            >记录</a-button
          > -->
          <a-button
            v-if="
              record.qrStatus !== 'voided' &&
              !record.disabled &&
              (record.version ? canEdit : canCreate)
            "
            type="link"
            size="small"
            @click="emit('bind', record as QrManagementItem)"
            >{{ record.version ? '编辑绑定' : '绑定学生' }}</a-button
          >
        </a-space>
      </template>
    </ConfigTable>
  </div>

  <QrManagementDetailDrawer
    v-if="selected"
    :key="selected.id"
    :id="selected.id"
    :initial-tab="tab"
    :can-edit="canEdit"
    @close="selected = null"
    @changed="emit('refresh')"
  />
</template>

<style scoped>
.qr-results {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.qr-results__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  border-bottom: 1px solid #f0f0f0;
}
.qr-results__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.qr-results__header span,
.secondary {
  color: #8492a8;
  font-size: 12px;
}
.secondary {
  margin-top: 4px;
}
.qr-code {
  height: auto;
  padding: 0;
  font-size: 12px;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}
.qr-results :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}
.qr-results :deep(.ant-table-cell) {
  font-size: 13px;
}
</style>
