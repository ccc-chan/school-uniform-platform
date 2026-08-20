<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  updateRoleStatus,
} from '@/api/system'
import PageHeader from '@/components/common/PageHeader.vue'
import type { ConfigFormField } from '@/components/common/types'
import { useAuthStore } from '@/stores/auth'
import type { Role, RoleInput } from '@/types/system'
import { confirmAction } from '@/utils/modal'
const authStore = useAuthStore()
const canDelete = computed(() => authStore.profile.roleCode === 'SUPER_ADMIN')
const items = shallowRef<Role[]>([]),
  loading = shallowRef(false),
  editorOpen = shallowRef(false),
  current = shallowRef<Role | null>(null),
  keyword = shallowRef('')
const filterModel = computed<Record<string, unknown>>({
  get: () => ({ keyword: keyword.value }),
  set: (value) => {
    keyword.value = String(value.keyword ?? '')
  },
})
const filterFields: ConfigFormField[] = [
  {
    key: 'keyword',
    itemClass: 'w-full sm:w-auto',
    label: '',
    type: 'input',
    placeholder: '搜索角色名称、编码或说明',
    componentProps: {
      allowClear: true,
      style: { width: '360px' },
      onPressEnter: load,
    },
  },
]
async function load() {
  loading.value = true
  try {
    items.value = await getRoles(keyword.value)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '角色数据加载失败')
  } finally {
    loading.value = false
  }
}
function openEditor(item: Role | null = null) {
  current.value = item
  editorOpen.value = true
}
async function save(value: RoleInput) {
  try {
    current.value
      ? await updateRole(current.value.id, value)
      : await createRole(value)
    message.success(current.value ? '角色权限已更新' : '角色已创建')
    editorOpen.value = false
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败')
  }
}
async function toggle(item: Role) {
  if (item.employeeCount && item.status === 'enabled') {
    message.warning('该角色仍有关联员工，不能停用')
    return
  }
  await updateRoleStatus(
    item.id,
    item.status === 'enabled' ? 'disabled' : 'enabled',
  )
  message.success('角色状态已更新')
  await load()
}
function remove(item: Role) {
  if (item.employeeCount) {
    message.warning('该角色仍有关联员工，不能删除')
    return
  }
  confirmAction({
    title: '确认删除角色',
    content: `删除后无法恢复，确定删除角色“${item.name}”吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRole(item.id)
        message.success('角色已删除')
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
        title="角色权限管理"
        description="配置角色的菜单权限、操作权限和数据范围"
      >
        <template #actions>
          <a-button type="primary" @click="openEditor()">新增角色</a-button>
        </template>
      </PageHeader>
      <ConfigForm
        v-model="filterModel"
        class="role-filter-form mt-5"
        layout="inline"
        :fields="filterFields"
        ><a-button @click="load">查询</a-button></ConfigForm
      >
    </div>
    <div class="page-card overflow-hidden">
      <RoleTable
        :items="items"
        :loading="loading"
        :can-delete="canDelete"
        @edit="openEditor"
        @toggle="toggle"
        @delete="remove"
      />
    </div>
    <RoleEditor v-model:open="editorOpen" :role="current" @submit="save" />
  </section>
</template>
