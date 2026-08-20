<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { ConfigFormField } from '@/components/common/types'
import type { Role, RoleInput } from '@/types/system'

const props = defineProps<{ open: boolean; role: Role | null }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: RoleInput]
}>()
const menuOptions = [
  { label: '仪表盘', value: 'shortcut_dashboard' },
  { label: '产品管理', value: 'shortcut_products' },
  { label: '标签打印', value: 'shortcut_label_print' },
  { label: '公司设置', value: 'shortcut_company_settings' },
  { label: '系统管理', value: 'shortcut_system' },
]
const operationOptions = [
  { label: '查看', value: 'view' },
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'edit' },
  { label: '删除', value: 'delete' },
  { label: '导出', value: 'export' },
]
const operationPermissionCodes = new Set(
  operationOptions.map(({ value }) => value),
)
const form = reactive<RoleInput>({
  name: '',
  code: '',
  description: '',
  dataScope: '本人数据',
  menuPermissions: [],
  operationPermissions: [],
  status: 'enabled',
})
const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: (value) => Object.assign(form, value),
})
const fields = computed<ConfigFormField[]>(() => [
  { key: 'name', label: '角色名称', type: 'input', required: true },
  {
    key: 'code',
    label: '角色编码',
    type: 'input',
    required: true,
    disabled: Boolean(props.role),
  },
  {
    key: 'description',
    label: '角色说明',
    type: 'textarea',
    span: 2,
    componentProps: { rows: 2 },
  },
  {
    key: 'dataScope',
    label: '数据范围',
    type: 'select',
    required: true,
    span: 2,
    options: ['全部数据', '本部门及下级部门', '本部门数据', '本人数据'].map(
      (value) => ({ label: value, value }),
    ),
  },
  {
    key: 'menuPermissions',
    label: '菜单权限',
    type: 'checkbox',
    required: true,
    span: 2,
    options: menuOptions,
    componentProps: { class: 'permission-grid' },
  },
  {
    key: 'operationPermissions',
    label: '操作权限',
    type: 'checkbox',
    span: 2,
    options: operationOptions,
    componentProps: { class: 'permission-grid' },
  },
  {
    key: 'status',
    label: '角色状态',
    type: 'radio',
    span: 2,
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
])

watch(
  () => [props.open, props.role] as const,
  () => {
    const item = props.role
    Object.assign(
      form,
      item
        ? {
            name: item.name,
            code: item.code,
            description: item.description,
            dataScope: item.dataScope,
            menuPermissions: [...item.menuPermissions],
            operationPermissions: item.operationPermissions.filter((code) =>
              operationPermissionCodes.has(code),
            ),
            status: item.status,
          }
        : {
            name: '',
            code: '',
            description: '',
            dataScope: '本人数据',
            menuPermissions: [],
            operationPermissions: [],
            status: 'enabled',
          },
    )
  },
  { immediate: true },
)

function submit() {
  if (!form.name.trim() || !form.code.trim() || !form.menuPermissions.length) {
    message.warning('请填写角色名称、编码并选择菜单权限')
    return
  }
  emit('submit', {
    ...form,
    menuPermissions: [...form.menuPermissions],
    operationPermissions: [...form.operationPermissions],
  })
}
</script>

<template>
  <a-modal
    :open="open"
    :title="role ? '编辑角色权限' : '新增角色'"
    :width="720"
    wrap-class-name="responsive-modal"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" :columns="2" />
  </a-modal>
</template>

<style scoped>
:deep(.permission-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (min-width: 640px) {
  :deep(.permission-grid) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
