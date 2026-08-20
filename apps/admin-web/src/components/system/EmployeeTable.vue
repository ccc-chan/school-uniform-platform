<script setup lang="ts">
import StatusTag from '@/components/common/StatusTag.vue'
import { ACCOUNT_STATUS_MAP } from '@/constants/status'
import type { Employee } from '@/types/system'

const { items, loading, canDelete, total, page, pageSize } = defineProps<{
  items: Employee[]
  loading: boolean
  canDelete: boolean
  total: number
  page: number
  pageSize: number
}>()
const emit = defineEmits<{
  edit: [value: Employee]
  toggle: [value: Employee]
  reset: [value: Employee]
  delete: [value: Employee]
  page: [value: number]
}>()
function edit(record: Record<string, unknown>) {
  emit('edit', record as unknown as Employee)
}
function toggle(record: Record<string, unknown>) {
  emit('toggle', record as unknown as Employee)
}
function reset(record: Record<string, unknown>) {
  emit('reset', record as unknown as Employee)
}
function remove(record: Record<string, unknown>) {
  emit('delete', record as unknown as Employee)
}
const columns = [
  { title: '员工', key: 'employee', width: 180 },
  { title: '角色', dataIndex: 'roleName', key: 'roleName', width: 130 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 150 },
  { title: '账号状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  {
    title: '最后登录',
    dataIndex: 'lastLoginAt',
    key: 'lastLoginAt',
    width: 170,
  },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 240 },
]
const tableItems = computed(
  () => items as unknown as Record<string, unknown>[],
)
</script>

<template>
  <div class="hidden md:block">
    <ConfigTable
      :columns="columns"
      :items="tableItems"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      row-key="id"
      :scroll-x="1100"
      @change="emit('page', $event)"
    >
      <template #cell="{ column, record, value }">
        <template v-if="column.key === 'employee'"
          ><OverflowTooltip
            class="font-600 text-slate-800"
            :content="record.name"
          />
          <OverflowTooltip
            class="mt-1 text-xs text-slate-400"
            :content="`${record.account} · ${record.phone}`"
          /></template
        >
        <StatusTag
          v-else-if="column.key === 'status'"
          :value="String(record.status || '')"
          :map="ACCOUNT_STATUS_MAP"
        />
        <template v-else-if="column.key === 'actions'"
          ><a-space
            ><a-button type="link" size="small" @click="edit(record)"
              >编辑</a-button
            ><a-button type="link" size="small" @click="reset(record)"
              >重置密码</a-button
            ><a-button
              type="link"
              size="small"
              :danger="record.status === 'enabled'"
              @click="toggle(record)"
              >{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button
            ><a-button
              v-if="canDelete"
              type="link"
              size="small"
              danger
              @click="remove(record)"
              >删除</a-button
            ></a-space
          ></template
        >
        <OverflowTooltip v-else :content="value" />
      </template>
    </ConfigTable>
  </div>
</template>
