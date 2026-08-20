<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  getRoles,
  resetEmployeePassword,
  updateEmployee,
  updateEmployeeStatus,
} from '@/api/system'
import PageHeader from '@/components/common/PageHeader.vue'
import type { ConfigFormField } from '@/components/common/types'
import { useAuthStore } from '@/stores/auth'
import type { Employee, EmployeeInput, Role } from '@/types/system'
import { confirmAction } from '@/utils/modal'

const authStore = useAuthStore()
const canDelete = computed(() => authStore.profile.roleCode === 'SUPER_ADMIN')

const items = shallowRef<Employee[]>([]),
  roles = shallowRef<Role[]>([]),
  loading = shallowRef(false),
  editorOpen = shallowRef(false),
  current = shallowRef<Employee | null>(null)
const total = shallowRef(0),
  page = shallowRef(1),
  pageSize = shallowRef(10)
const filters = reactive({ keyword: '', roleId: '', status: '' })
const filterModel = computed<Record<string, unknown>>({
  get: () => filters,
  set: value => Object.assign(filters, value),
})
const filterFields = computed<ConfigFormField[]>(() => [
  {
    key: 'keyword',
    itemClass: 'w-full sm:w-auto',
    label: '',
    type: 'input',
    placeholder: '搜索姓名、账号、手机号或部门',
    componentProps: {
      allowClear: true,
      style: { width: '280px' },
      onPressEnter: search,
    },
  },
  {
    key: 'roleId',
    itemClass: 'w-full sm:w-auto',
    label: '',
    type: 'select',
    placeholder: '全部角色',
    options: roles.value.map(item => ({ label: item.name, value: item.id })),
    componentProps: {
      allowClear: true,
      style: { width: '180px' },
    },
  },
  {
    key: 'status',
    itemClass: 'w-full sm:w-auto',
    label: '',
    type: 'select',
    placeholder: '全部状态',
    options: [
      { label: '已启用', value: 'enabled' },
      { label: '已停用', value: 'disabled' },
    ],
    componentProps: {
      allowClear: true,
      style: { width: '152px' },
    },
  },
])

async function load() {
  loading.value = true
  try {
    const [result, roleItems] = await Promise.all([
      getEmployees({ ...filters, page: page.value, pageSize: pageSize.value }),
      getRoles(),
    ])
    items.value = result.items
    total.value = result.total
    roles.value = roleItems
  } catch (error) {
    message.error(error instanceof Error ? error.message : '员工数据加载失败')
  } finally {
    loading.value = false
  }
}
function search() {
  page.value = 1
  load()
}
function openEditor(item: Employee | null = null) {
  current.value = item
  editorOpen.value = true
}
async function save(value: EmployeeInput) {
  try {
    current.value
      ? await updateEmployee(current.value.id, value)
      : await createEmployee(value)
    message.success(current.value ? '员工信息已更新' : '员工账号已创建')
    editorOpen.value = false
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  }
}
async function toggle(item: Employee) {
  await updateEmployeeStatus(
    item.id,
    item.status === 'enabled' ? 'disabled' : 'enabled',
  )
  message.success('账号状态已更新')
  await load()
}
async function reset(item: Employee) {
  const result = await resetEmployeePassword(item.id)
  Modal.success({
    title: '密码重置成功',
    content: `员工 ${item.name} 的临时密码为：${result.temporaryPassword}`,
  })
}
function remove(item: Employee) {
  confirmAction({
    title: '确认删除员工',
    content: `删除后无法恢复，确定删除员工“${item.name}”吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteEmployee(item.id)
        message.success('员工已删除')
        if (items.value.length === 1 && page.value > 1) page.value -= 1
        await load()
      } catch (error) {
        message.error(error instanceof Error ? error.message : '删除失败')
      }
    },
  })
}
onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <PageHeader
        title="员工账号管理"
        description="维护员工账号、所属角色及启用状态"
      >
        <template #actions>
          <a-button type="primary" @click="openEditor()">新增员工</a-button>
        </template>
      </PageHeader>
      <ConfigForm
        v-model="filterModel"
        class="employee-filter-form mt-5"
        layout="inline"
        :fields="filterFields"
      >
        <a-button @click="search">查询</a-button>
      </ConfigForm>
    </div>
    <div class="page-card overflow-hidden">
      <EmployeeTable
        :items="items"
        :loading="loading"
        :can-delete="canDelete"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @edit="openEditor"
        @toggle="toggle"
        @reset="reset"
        @delete="remove"
        @page="page = $event; load()"
      />
    </div>
    <EmployeeEditor
      v-model:open="editorOpen"
      :employee="current"
      :roles="roles"
      @submit="save"
    />
  </section>
</template>
