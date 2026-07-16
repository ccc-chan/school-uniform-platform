<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { Role, RoleInput } from '@/types/system'

const props = defineProps<{ open: boolean; role: Role | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; submit: [value: RoleInput] }>()
const menuOptions = [{ label: '首页概览', value: 'dashboard' }, { label: '产品中心', value: 'products' }, { label: '二维码中心', value: 'qrcodes' }, { label: '生产中心', value: 'production' }, { label: '检测中心', value: 'quality' }, { label: '品牌中心', value: 'brand' }, { label: '数据统计', value: 'analytics' }, { label: '系统管理', value: 'system' }]
const operationOptions = [{ label: '查看', value: 'view' }, { label: '新增', value: 'create' }, { label: '编辑', value: 'edit' }, { label: '删除', value: 'delete' }, { label: '导出', value: 'export' }, { label: '审核', value: 'audit' }]
const form = reactive<RoleInput>({ name: '', code: '', description: '', dataScope: '本人数据', menuPermissions: [], operationPermissions: [], status: 'enabled' })

watch(() => [props.open, props.role] as const, () => {
  const item = props.role
  Object.assign(form, item ? { name: item.name, code: item.code, description: item.description, dataScope: item.dataScope, menuPermissions: [...item.menuPermissions], operationPermissions: [...item.operationPermissions], status: item.status } : { name: '', code: '', description: '', dataScope: '本人数据', menuPermissions: [], operationPermissions: [], status: 'enabled' })
}, { immediate: true })

function submit() {
  if (!form.name.trim() || !form.code.trim() || !form.menuPermissions.length) { message.warning('请填写角色名称、编码并选择菜单权限'); return }
  emit('submit', { ...form, menuPermissions: [...form.menuPermissions], operationPermissions: [...form.operationPermissions] })
}
</script>

<template>
  <a-modal :open="open" :title="role ? '编辑角色权限' : '新增角色'" :width="720" wrap-class-name="responsive-modal" @cancel="emit('update:open', false)" @ok="submit">
    <a-form layout="vertical"><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><a-form-item label="角色名称" required><a-input v-model:value="form.name" /></a-form-item><a-form-item label="角色编码" required><a-input v-model:value="form.code" :disabled="Boolean(role)" /></a-form-item></div>
      <a-form-item label="角色说明"><a-textarea v-model:value="form.description" :rows="2" /></a-form-item>
      <a-form-item label="数据范围" required><a-select v-model:value="form.dataScope" :options="['全部数据', '本部门及下级部门', '本部门数据', '本人数据'].map(value => ({ label: value, value }))" /></a-form-item>
      <a-form-item label="菜单权限" required><a-checkbox-group v-model:value="form.menuPermissions" class="permission-grid" :options="menuOptions" /></a-form-item>
      <a-form-item label="操作权限"><a-checkbox-group v-model:value="form.operationPermissions" class="permission-grid" :options="operationOptions" /></a-form-item>
      <a-form-item label="角色状态"><a-radio-group v-model:value="form.status"><a-radio value="enabled">启用</a-radio><a-radio value="disabled">停用</a-radio></a-radio-group></a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>.permission-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } @media (min-width: 640px) { .permission-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }</style>
