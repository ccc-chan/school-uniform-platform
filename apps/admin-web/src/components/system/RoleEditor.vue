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
  { label: '首页概览', value: 'dashboard' },
  { label: '产品中心', value: 'products' },
  { label: '二维码中心', value: 'qrcodes' },
  { label: '生产中心', value: 'production' },
  { label: '检测中心', value: 'quality' },
  { label: '品牌中心', value: 'brand' },
  { label: '数据统计', value: 'analytics' },
  { label: '系统管理', value: 'system' },
]
const operationOptions = [
  { label: '查看', value: 'view' },
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'edit' },
  { label: '删除', value: 'delete' },
  { label: '导出', value: 'export' },
  { label: '审核', value: 'audit' },
  { label: '产品列表', value: 'product.view' },
  { label: '产品图片字段', value: 'product.field.image' },
  { label: '产品编号字段', value: 'product.field.code' },
  { label: '产品名称字段', value: 'product.field.name' },
  { label: '产品分类字段', value: 'product.field.category' },
  { label: '产品季节字段', value: 'product.field.season' },
  { label: '产品状态字段', value: 'product.field.status' },
  { label: '产品创建时间字段', value: 'product.field.created_at' },
  { label: '新建产品', value: 'product.create' },
  { label: '编辑产品', value: 'product.edit' },
  { label: '更新产品状态', value: 'product.status' },
  { label: '删除产品', value: 'product.delete' },
  { label: '查看二维码数据', value: 'qrcode.view' },
  { label: '生成二维码', value: 'qrcode.generate' },
  { label: '批量生成二维码', value: 'qrcode.batch_generate' },
  { label: '绑定二维码', value: 'qrcode.bind' },
  { label: '查看二维码编号字段', value: 'qrcode.field.code' },
  { label: '查看绑定产品字段', value: 'qrcode.field.product' },
  { label: '查看二维码状态字段', value: 'qrcode.field.status' },
  { label: '查看二维码创建时间字段', value: 'qrcode.field.created_at' },
  { label: '查看数据统计', value: 'analytics.view' },
]
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
            operationPermissions: [...item.operationPermissions],
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
