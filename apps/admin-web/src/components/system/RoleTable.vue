<!--
 * @Author: Chan
 * @Date: 2026-07-16 09:43:59
 * @LastEditors: chan
 * @LastEditTime: 2026-07-16 14:38:42
 * @FilePath: /school-uniform-platform/apps/admin-web/src/components/system/RoleTable.vue
 * @Description: 
 * 
-->
<script setup lang="ts">
import StatusTag from '@/components/common/StatusTag.vue'
import type { Role } from '@/types/system'
const { items, loading, canDelete } = defineProps<{
  items: Role[]
  loading: boolean
  canDelete: boolean
}>()
const emit = defineEmits<{
  edit: [value: Role]
  toggle: [value: Role]
  delete: [value: Role]
}>()
function edit(record: Record<string, unknown>) {
  emit('edit', record as unknown as Role)
}
function toggle(record: Record<string, unknown>) {
  emit('toggle', record as unknown as Role)
}
function remove(record: Record<string, unknown>) {
  emit('delete', record as unknown as Role)
}
const columns = [
  { title: '角色名称', key: 'role', width: 190 },
  { title: '数据范围', dataIndex: 'dataScope', key: 'dataScope', width: 160 },
  {
    title: '成员数',
    dataIndex: 'employeeCount',
    key: 'employeeCount',
    width: 90,
  },
  { title: '权限配置', key: 'permissions' },
  { title: '状态', key: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 180 },
]
const tableItems = computed(() => items as unknown as Record<string, unknown>[])
</script>

<template>
  <div class="hidden md:block">
    <ConfigTable
      :columns="columns"
      :items="tableItems"
      :loading="loading"
      row-key="id"
      :scroll-x="1050"
      ><template #cell="{ column, record, value }">
        <template v-if="column.key === 'role'"
          ><OverflowTooltip
            class="font-600 text-slate-800"
            :content="record.name"
          />
          <OverflowTooltip
            class="mt-1 text-xs text-slate-400"
            :content="record.code"
          /></template
        >
        <template v-else-if="column.key === 'permissions'"
          ><OverflowTooltip
            class="text-sm"
            :content="`菜单 ${record.menuPermissions.length} 项 · 操作 ${record.operationPermissions.length} 项`"
          />
          <OverflowTooltip
            class="mt-1 text-xs text-slate-400"
            :content="record.description"
          /></template
        >
        <StatusTag
          v-else-if="column.key === 'status'"
          :value="String(record.status || '')"
        />
        <template v-else-if="column.key === 'actions'"
          ><a-button type="link" size="small" @click="edit(record)"
            >配置</a-button
          ><a-button
            type="link"
            size="small"
            :danger="record.status === 'enabled'"
            @click="toggle(record)"
            >{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button
          ><a-button
            v-if="canDelete && record.code !== 'SUPER_ADMIN'"
            type="link"
            size="small"
            danger
            @click="remove(record)"
            >删除</a-button
          ></template
        >
        <OverflowTooltip v-else :content="value" />
      </template></ConfigTable
    >
  </div>
</template>
