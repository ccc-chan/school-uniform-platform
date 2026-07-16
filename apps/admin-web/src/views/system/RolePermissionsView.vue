<script setup lang="ts">
import { message } from 'ant-design-vue'
import { createRole, getRoles, updateRole, updateRoleStatus } from '@/api/system'
import type { Role, RoleInput } from '@/types/system'
const items = shallowRef<Role[]>([]), loading = shallowRef(false), editorOpen = shallowRef(false), current = shallowRef<Role | null>(null), keyword = shallowRef('')
async function load() { loading.value = true; try { items.value = await getRoles(keyword.value) } catch (error) { message.error(error instanceof Error ? error.message : '角色数据加载失败') } finally { loading.value = false } }
function openEditor(item: Role | null = null) { current.value = item; editorOpen.value = true }
async function save(value: RoleInput) { try { current.value ? await updateRole(current.value.id, value) : await createRole(value); message.success(current.value ? '角色权限已更新' : '角色已创建'); editorOpen.value = false; await load() } catch (error) { message.error(error instanceof Error ? error.message : '保存失败') } }
async function toggle(item: Role) { if (item.employeeCount && item.status === 'enabled') { message.warning('该角色仍有关联员工，不能停用'); return } await updateRoleStatus(item.id, item.status === 'enabled' ? 'disabled' : 'enabled'); message.success('角色状态已更新'); await load() }
onMounted(load)
</script>

<template><section class="mx-auto max-w-400 space-y-4"><div class="page-card"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="page-title">角色权限管理</h2><p class="mb-0 mt-2 text-secondary">配置角色的菜单权限、操作权限和数据范围</p></div><a-button type="primary" @click="openEditor()">新增角色</a-button></div><div class="mt-5 flex flex-col gap-3 sm:flex-row"><a-input v-model:value="keyword" allow-clear class="sm:max-w-90" placeholder="搜索角色名称、编码或说明" @press-enter="load" /><a-button @click="load">查询</a-button></div></div>
  <div class="page-card overflow-hidden"><RoleTable :items="items" :loading="loading" @edit="openEditor" @toggle="toggle" /></div><RoleEditor v-model:open="editorOpen" :role="current" @submit="save" /></section></template>
