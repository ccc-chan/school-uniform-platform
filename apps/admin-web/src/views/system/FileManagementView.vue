<script setup lang="ts">
import { message } from 'ant-design-vue'
import { deleteFile, downloadFile, getFileBlob, getFiles } from '@/api/system'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'
import type { ManagedFile } from '@/types/system'
import { confirmAction } from '@/utils/modal'

const authStore = useAuthStore()
const canDelete = computed(() => authStore.profile.roleCode === 'SUPER_ADMIN')
const items = shallowRef<ManagedFile[]>([])
const loading = shallowRef(false)
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const filters = reactive({ keyword: '', category: '' })

async function load() {
  loading.value = true
  try {
    const result = await getFiles({ ...filters, page: page.value, pageSize: pageSize.value })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '文件数据加载失败')
  } finally { loading.value = false }
}
function search() { page.value = 1; load() }
async function preview(file: ManagedFile) {
  try { const blob = await getFileBlob(file.id); const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000) }
  catch (error) { message.error(error instanceof Error ? error.message : '文件预览失败') }
}
async function download(file: ManagedFile) {
  try { await downloadFile(file) } catch (error) { message.error(error instanceof Error ? error.message : '文件下载失败') }
}
function remove(file: ManagedFile) {
  confirmAction({ title: '确认删除文件', content: `删除后无法恢复，确定删除“${file.name}”吗？`, okType: 'danger', async onOk() { await deleteFile(file.id); message.success('文件已删除'); if (items.value.length === 1 && page.value > 1) page.value -= 1; await load() } })
}
onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <PageHeader
        title="文件管理"
        description="集中管理平台图片和检测报告"
      >
        <template #actions>
          <FileUpload mode="button" @success="load" />
        </template>
      </PageHeader>
      <div class="mt-5 flex flex-wrap gap-3">
        <a-input v-model:value="filters.keyword" allow-clear class="w-64" placeholder="搜索文件名称" @press-enter="search" />
        <a-select v-model:value="filters.category" allow-clear class="w-40" placeholder="全部类型" :options="[{ label: '图片', value: 'image' }, { label: '报告', value: 'report' }]" />
        <a-button @click="search">查询</a-button>
      </div>
    </div>
    <div class="page-card overflow-hidden">
      <FileTable
        :items="items"
        :loading="loading"
        :can-delete="canDelete"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @preview="preview"
        @download="download"
        @delete="remove"
        @page="page = $event; load()"
      />
    </div>
  </section>
</template>
