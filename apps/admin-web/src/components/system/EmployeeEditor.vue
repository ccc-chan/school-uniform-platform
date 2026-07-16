<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { Employee, EmployeeInput, Role } from '@/types/system'

const props = defineProps<{ open: boolean; employee: Employee | null; roles: Role[] }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; submit: [value: EmployeeInput] }>()

const form = reactive<EmployeeInput>({ name: '', phone: '', account: '', roleId: 0, department: '', status: 'enabled' })
const isEditing = computed(() => Boolean(props.employee))

watch(() => [props.open, props.employee] as const, () => {
  const item = props.employee
  Object.assign(form, item ? { name: item.name, phone: item.phone, account: item.account, roleId: item.roleId, department: item.department, status: item.status } : { name: '', phone: '', account: '', roleId: props.roles[0]?.id ?? 0, department: '', status: 'enabled' })
}, { immediate: true })

function submit() {
  if (!form.name.trim() || !form.phone.trim() || !form.account.trim() || !form.roleId || !form.department.trim()) {
    message.warning('请完整填写员工信息')
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <a-modal :open="open" :title="isEditing ? '编辑员工账号' : '新增员工账号'" :width="620" wrap-class-name="responsive-modal" @cancel="emit('update:open', false)" @ok="submit">
    <a-form layout="vertical" class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
      <a-form-item label="姓名" required><a-input v-model:value="form.name" placeholder="请输入员工姓名" /></a-form-item>
      <a-form-item label="手机号" required><a-input v-model:value="form.phone" placeholder="请输入手机号" /></a-form-item>
      <a-form-item label="登录账号" required><a-input v-model:value="form.account" :disabled="isEditing" placeholder="请输入登录账号" /></a-form-item>
      <a-form-item label="所属角色" required><a-select v-model:value="form.roleId" :options="roles.filter(item => item.status === 'enabled').map(item => ({ label: item.name, value: item.id }))" /></a-form-item>
      <a-form-item label="所属部门" required><a-input v-model:value="form.department" placeholder="请输入部门名称" /></a-form-item>
      <a-form-item label="账号状态"><a-radio-group v-model:value="form.status"><a-radio value="enabled">启用</a-radio><a-radio value="disabled">停用</a-radio></a-radio-group></a-form-item>
    </a-form>
  </a-modal>
</template>
