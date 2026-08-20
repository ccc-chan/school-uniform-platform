<script setup lang="ts">
import type { ManagedFile } from '@/types/system'

const props = defineProps<{
  items: ManagedFile[]
  loading: boolean
  canDelete: boolean
  total: number
  page: number
  pageSize: number
}>()
const emit = defineEmits<{
  download: [value: ManagedFile]
  preview: [value: ManagedFile]
  delete: [value: ManagedFile]
  page: [value: number]
}>()
const columns = [
  { title: '文件名称', dataIndex: 'name', key: 'name', width: 300 },
  { title: '类型', key: 'category', width: 100 },
  { title: '大小', key: 'size', width: 110 },
  { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 180 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 210 },
]
const tableItems = computed(() => props.items as unknown as Record<string, unknown>[])
function asFile(record: Record<string, unknown>) { return record as unknown as ManagedFile }
function formatSize(value: unknown) { const size = Number(value); return size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB` }
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="tableItems"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="1080"
    @change="emit('page', $event)"
  >
    <template #cell="{ column, record, value }">
      <a-tag v-if="column.key === 'category'" :color="record.category === 'image' ? 'blue' : 'purple'">{{ record.category === 'image' ? '图片' : '报告' }}</a-tag>
      <template v-else-if="column.key === 'size'">{{ formatSize(value) }}</template>
      <a-space v-else-if="column.key === 'actions'">
        <a-button v-if="record.category === 'image'" type="link" size="small" @click="emit('preview', asFile(record))">预览</a-button>
        <a-button type="link" size="small" @click="emit('download', asFile(record))">下载</a-button>
        <a-button v-if="canDelete" type="link" size="small" danger @click="emit('delete', asFile(record))">删除</a-button>
      </a-space>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
