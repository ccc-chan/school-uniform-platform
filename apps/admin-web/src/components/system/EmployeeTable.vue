<script setup lang="ts">
import type { Employee } from '@/types/system'

defineProps<{ items: Employee[]; loading: boolean }>()
const emit = defineEmits<{ edit: [value: Employee]; toggle: [value: Employee]; reset: [value: Employee] }>()
function edit(record: Record<string, unknown>) { emit('edit', record as unknown as Employee) }
function toggle(record: Record<string, unknown>) { emit('toggle', record as unknown as Employee) }
function reset(record: Record<string, unknown>) { emit('reset', record as unknown as Employee) }
const columns = [
  { title: '员工', key: 'employee', width: 180 }, { title: '角色', dataIndex: 'roleName', key: 'roleName', width: 130 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 150 }, { title: '账号状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 }, { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 170 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 190 },
]
</script>

<template>
  <div class="hidden md:block"><a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1100 }">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'employee'"><div class="font-600 text-slate-800">{{ record.name }}</div><div class="mt-1 text-xs text-slate-400">{{ record.account }} · {{ record.phone }}</div></template>
      <template v-else-if="column.key === 'status'"><a-tag :color="record.status === 'enabled' ? 'green' : 'default'">{{ record.status === 'enabled' ? '已启用' : '已停用' }}</a-tag></template>
      <template v-else-if="column.key === 'actions'"><a-space><a-button type="link" size="small" @click="edit(record)">编辑</a-button><a-button type="link" size="small" @click="reset(record)">重置密码</a-button><a-button type="link" size="small" :danger="record.status === 'enabled'" @click="toggle(record)">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button></a-space></template>
    </template>
  </a-table></div>
  <a-spin :spinning="loading" class="md:hidden"><a-empty v-if="!items.length" /><div v-else class="space-y-3"><article v-for="item in items" :key="item.id" class="rounded-3 border border-slate-100 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-3"><div><div class="font-700 text-slate-900">{{ item.name }}</div><div class="mt-1 text-xs text-slate-400">{{ item.account }} · {{ item.phone }}</div></div><a-tag :color="item.status === 'enabled' ? 'green' : 'default'">{{ item.status === 'enabled' ? '已启用' : '已停用' }}</a-tag></div>
    <div class="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span class="text-slate-400">角色</span><div class="mt-1">{{ item.roleName }}</div></div><div><span class="text-slate-400">部门</span><div class="mt-1">{{ item.department }}</div></div><div class="col-span-2"><span class="text-slate-400">最后登录</span><div class="mt-1">{{ item.lastLoginAt }}</div></div></div>
    <div class="mt-3 flex flex-wrap justify-end border-t border-slate-100 pt-3"><a-button type="link" size="small" @click="emit('edit', item)">编辑</a-button><a-button type="link" size="small" @click="emit('reset', item)">重置密码</a-button><a-button type="link" size="small" :danger="item.status === 'enabled'" @click="emit('toggle', item)">{{ item.status === 'enabled' ? '停用' : '启用' }}</a-button></div>
  </article></div></a-spin>
</template>
