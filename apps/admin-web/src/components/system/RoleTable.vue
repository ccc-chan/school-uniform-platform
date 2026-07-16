<script setup lang="ts">
import type { Role } from '@/types/system'
defineProps<{ items: Role[]; loading: boolean }>()
const emit = defineEmits<{ edit: [value: Role]; toggle: [value: Role] }>()
function edit(record: Record<string, unknown>) { emit('edit', record as unknown as Role) }
function toggle(record: Record<string, unknown>) { emit('toggle', record as unknown as Role) }
const columns = [{ title: '角色名称', key: 'role', width: 190 }, { title: '数据范围', dataIndex: 'dataScope', key: 'dataScope', width: 160 }, { title: '成员数', dataIndex: 'employeeCount', key: 'employeeCount', width: 90 }, { title: '权限配置', key: 'permissions' }, { title: '状态', key: 'status', width: 90 }, { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 }, { title: '操作', key: 'actions', fixed: 'right' as const, width: 130 }]
</script>

<template>
  <div class="hidden md:block"><a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1050 }"><template #bodyCell="{ column, record }">
    <template v-if="column.key === 'role'"><div class="font-600 text-slate-800">{{ record.name }}</div><div class="mt-1 text-xs text-slate-400">{{ record.code }}</div></template>
    <template v-else-if="column.key === 'permissions'"><div class="text-sm">菜单 {{ record.menuPermissions.length }} 项 · 操作 {{ record.operationPermissions.length }} 项</div><div class="mt-1 truncate text-xs text-slate-400">{{ record.description }}</div></template>
    <template v-else-if="column.key === 'status'"><a-tag :color="record.status === 'enabled' ? 'green' : 'default'">{{ record.status === 'enabled' ? '启用' : '停用' }}</a-tag></template>
    <template v-else-if="column.key === 'actions'"><a-button type="link" size="small" @click="edit(record)">配置</a-button><a-button type="link" size="small" :danger="record.status === 'enabled'" @click="toggle(record)">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button></template>
  </template></a-table></div>
  <a-spin :spinning="loading" class="md:hidden"><a-empty v-if="!items.length" /><div v-else class="space-y-3"><article v-for="item in items" :key="item.id" class="rounded-3 border border-slate-100 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between"><div><div class="font-700 text-slate-900">{{ item.name }}</div><div class="mt-1 text-xs text-slate-400">{{ item.code }}</div></div><a-tag :color="item.status === 'enabled' ? 'green' : 'default'">{{ item.status === 'enabled' ? '启用' : '停用' }}</a-tag></div>
    <p class="my-3 text-sm text-slate-500">{{ item.description }}</p><div class="grid grid-cols-2 gap-3 text-sm"><div><span class="text-slate-400">数据范围</span><div class="mt-1">{{ item.dataScope }}</div></div><div><span class="text-slate-400">成员</span><div class="mt-1">{{ item.employeeCount }} 人</div></div></div>
    <div class="mt-3 flex justify-end border-t border-slate-100 pt-3"><a-button type="link" size="small" @click="emit('edit', item)">配置权限</a-button><a-button type="link" size="small" :danger="item.status === 'enabled'" @click="emit('toggle', item)">{{ item.status === 'enabled' ? '停用' : '启用' }}</a-button></div>
  </article></div></a-spin>
</template>
