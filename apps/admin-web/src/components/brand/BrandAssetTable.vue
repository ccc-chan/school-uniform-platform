<script setup lang="ts">
import type {
  BrandAsset,
  BrandAssetStatus,
  BrandAssetType,
} from '@/api/brand'
import BrandMediaPreview from '@/components/brand/BrandMediaPreview.vue'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{
  type: BrandAssetType
  items: BrandAsset[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  canManage: boolean
}>()

const emit = defineEmits<{
  edit: [item: BrandAsset]
  status: [item: BrandAsset, status: BrandAssetStatus]
  delete: [item: BrandAsset]
  pageChange: [page: number]
}>()

const columns = computed<ConfigTableColumn[]>(() => {
  const result: ConfigTableColumn[] = [
    { title: '封面', key: 'cover', width: 92 },
    {
      title: props.type === 'factory' ? '工厂名称' : props.type === 'video' ? '视频标题' : '故事标题',
      dataIndex: 'title',
      key: 'title',
      width: 190,
    },
  ]
  if (props.type === 'factory') {
    result.push({ title: '所在地区', dataIndex: 'location', key: 'location', width: 160 })
  }
  result.push({
    title: props.type === 'factory' ? '展示亮点' : props.type === 'video' ? '视频摘要' : '故事摘要',
    dataIndex: 'subtitle',
    key: 'subtitle',
    width: 260,
  })
  if (props.type === 'video') {
    result.push({ title: '视频文件', dataIndex: 'mediaFileName', key: 'mediaFileName', width: 210 })
  }
  result.push(
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
    { title: '操作', key: 'actions', fixed: 'right', width: 130 },
  )
  return result
})

const row = (record: Record<string, unknown>) =>
  record as unknown as BrandAsset
</script>

<template>
  <ConfigTable
    :columns="columns"
    :items="items as unknown as Record<string, unknown>[]"
    :loading="loading"
    :total="total"
    :page="page"
    :page-size="pageSize"
    :scroll-x="type === 'video' ? 1250 : 1080"
    @change="emit('pageChange', $event)"
  >
    <template #cell="{ column, record, value }">
      <div v-if="column.key === 'cover'" class="h-13 w-18 overflow-hidden rounded-2">
        <BrandMediaPreview :file-id="row(record).coverFileId" :alt="row(record).title" />
      </div>
      <a-select
        v-else-if="column.key === 'status' && canManage"
        :value="String(value || '')"
        size="small"
        class="w-22"
        :options="[
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ]"
        @change="emit('status', row(record), $event as BrandAssetStatus)"
      />
      <a-tag
        v-else-if="column.key === 'status'"
        :color="value === 'enabled' ? 'green' : 'default'"
      >
        {{ value === 'enabled' ? '启用' : '停用' }}
      </a-tag>
      <a-space v-else-if="column.key === 'actions' && canManage" :size="0">
        <a-button type="link" size="small" @click="emit('edit', row(record))">
          编辑
        </a-button>
        <a-popconfirm
          title="确定删除这条品牌内容吗？"
          ok-text="删除"
          cancel-text="取消"
          @confirm="emit('delete', row(record))"
        >
          <a-button type="link" danger size="small">删除</a-button>
        </a-popconfirm>
      </a-space>
      <span v-else-if="column.key === 'actions'" class="text-slate-400">—</span>
      <OverflowTooltip v-else :content="value" />
    </template>
  </ConfigTable>
</template>
