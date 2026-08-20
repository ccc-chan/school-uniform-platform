<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { ConfigFormField } from '@/components/common/types'
import type { Employee, EmployeeInput, Role } from '@/types/system'

const props = defineProps<{
  open: boolean
  employee: Employee | null
  roles: Role[]
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: EmployeeInput]
}>()

const form = reactive<EmployeeInput>({
  name: '',
  phone: '',
  account: '',
  roleId: 0,
  department: '',
  status: 'enabled',
})
const isEditing = computed(() => Boolean(props.employee))
const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: (value) => Object.assign(form, value),
})
const fields = computed<ConfigFormField[]>(() => [
  {
    key: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    placeholder: '请输入员工姓名',
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'input',
    required: true,
    placeholder: '请输入手机号',
  },
  {
    key: 'account',
    label: '登录账号',
    type: 'input',
    required: true,
    disabled: isEditing.value,
    placeholder: '请输入登录账号',
  },
  {
    key: 'roleId',
    label: '所属角色',
    type: 'select',
    required: true,
    options: props.roles
      .filter((item) => item.status === 'enabled')
      .map((item) => ({ label: item.name, value: item.id })),
  },
  {
    key: 'department',
    label: '所属部门',
    type: 'input',
    required: true,
    placeholder: '请输入部门名称',
  },
  {
    key: 'status',
    label: '账号状态',
    type: 'radio',
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
])

watch(
  () => [props.open, props.employee] as const,
  () => {
    const item = props.employee
    Object.assign(
      form,
      item
        ? {
            name: item.name,
            phone: item.phone,
            account: item.account,
            roleId: item.roleId,
            department: item.department,
            status: item.status,
          }
        : {
            name: '',
            phone: '',
            account: '',
            roleId: props.roles[0]?.id ?? 0,
            department: '',
            status: 'enabled',
          },
    )
  },
  { immediate: true },
)

function submit() {
  if (
    !form.name.trim() ||
    !form.phone.trim() ||
    !form.account.trim() ||
    !form.roleId ||
    !form.department.trim()
  ) {
    message.warning('请完整填写员工信息')
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <a-modal
    :open="open"
    :title="isEditing ? '编辑员工账号' : '新增员工账号'"
    :width="620"
    wrap-class-name="responsive-modal"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" :columns="2" />
  </a-modal>
</template>
