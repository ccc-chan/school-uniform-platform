<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import { createEmployee, getEmployees, getRoles, resetEmployeePassword, updateEmployee, updateEmployeeStatus } from '@/api/system'
import type { Employee, EmployeeInput, Role } from '@/types/system'

const items = shallowRef<Employee[]>([]), roles = shallowRef<Role[]>([]), loading = shallowRef(false), editorOpen = shallowRef(false), current = shallowRef<Employee | null>(null)
const total = shallowRef(0), page = shallowRef(1), pageSize = shallowRef(10)
const filters = reactive({ keyword: '', roleId: '', status: '' })

async function load() { loading.value = true; try { const [result, roleItems] = await Promise.all([getEmployees({ ...filters, page: page.value, pageSize: pageSize.value }), getRoles()]); items.value = result.items; total.value = result.total; roles.value = roleItems } catch (error) { message.error(error instanceof Error ? error.message : '员工数据加载失败') } finally { loading.value = false } }
function search() { page.value = 1; load() }
function openEditor(item: Employee | null = null) { current.value = item; editorOpen.value = true }
async function save(value: EmployeeInput) { try { current.value ? await updateEmployee(current.value.id, value) : await createEmployee(value); message.success(current.value ? '员工信息已更新' : '员工账号已创建'); editorOpen.value = false; await load() } catch (error) { message.error(error instanceof Error ? error.message : '保存失败') } }
async function toggle(item: Employee) { await updateEmployeeStatus(item.id, item.status === 'enabled' ? 'disabled' : 'enabled'); message.success('账号状态已更新'); await load() }
async function reset(item: Employee) { const result = await resetEmployeePassword(item.id); Modal.success({ title: '密码重置成功', content: `员工 ${item.name} 的临时密码为：${result.temporaryPassword}` }) }
onMounted(load)
</script>

<template><section class="mx-auto max-w-400 space-y-4"><div class="page-card"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="page-title">员工账号管理</h2><p class="mb-0 mt-2 text-secondary">维护员工账号、所属角色及启用状态</p></div><a-button type="primary" @click="openEditor()">新增员工</a-button></div>
  <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_150px_auto]"><a-input v-model:value="filters.keyword" allow-clear placeholder="搜索姓名、账号、手机号或部门" @press-enter="search" /><a-select v-model:value="filters.roleId" allow-clear placeholder="全部角色" :options="roles.map(item => ({ label: item.name, value: item.id }))" /><a-select v-model:value="filters.status" allow-clear placeholder="全部状态" :options="[{ label: '已启用', value: 'enabled' }, { label: '已停用', value: 'disabled' }]" /><a-button @click="search">查询</a-button></div></div>
  <div class="page-card overflow-hidden"><EmployeeTable :items="items" :loading="loading" @edit="openEditor" @toggle="toggle" @reset="reset" /><div class="mt-4 flex justify-end"><a-pagination v-model:current="page" v-model:page-size="pageSize" :total="total" :show-size-changer="false" size="small" @change="load" /></div></div>
  <EmployeeEditor v-model:open="editorOpen" :employee="current" :roles="roles" @submit="save" /></section></template>
