<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createQualityItem,
  getQualityItems,
  updateQualityItem,
  updateQualityItemStatus,
  type QualityInspectionItem,
  type QualityInspectionItemInput,
  type QualityItemStatus,
} from '@/api/quality'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import type { ConfigTableColumn } from '@/components/common/types'
import QualityItemEditor from '@/components/quality/QualityItemEditor.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const items = shallowRef<QualityInspectionItem[]>([])
const loading = shallowRef(false)
const saving = shallowRef(false)
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const filters = reactive({ keyword: '', status: '' })
const editorOpen = shallowRef(false)
const current = shallowRef<QualityInspectionItem | null>(null)

const canManage = computed(() => auth.hasPermission('quality.item.manage'))
const columns: ConfigTableColumn[] = [
  { title: '项目编号', dataIndex: 'code', key: 'code', width: 155 },
  { title: '检测项目', dataIndex: 'name', key: 'name', width: 180 },
  { title: '项目分类', dataIndex: 'category', key: 'category', width: 150 },
  { title: '标准要求', dataIndex: 'standardRequirement', key: 'standardRequirement', width: 360 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right', width: 85 },
]

async function load() {
  loading.value = true
  try {
    const result = await getQualityItems({
      ...filters,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测项目加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  Object.assign(filters, { keyword: '', status: '' })
  page.value = 1
  load()
}

function openEditor(item: QualityInspectionItem | null = null) {
  current.value = item
  editorOpen.value = true
}

async function save(value: QualityInspectionItemInput) {
  saving.value = true
  try {
    if (current.value) await updateQualityItem(current.value.id, value)
    else await createQualityItem(value)
    editorOpen.value = false
    message.success('检测项目保存成功')
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测项目保存失败')
  } finally {
    saving.value = false
  }
}

async function changeStatus(item: QualityInspectionItem, status: QualityItemStatus) {
  try {
    await updateQualityItemStatus(item.id, status)
    message.success('状态已更新')
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '状态更新失败')
  }
}

const row = (record: Record<string, unknown>) =>
  record as unknown as QualityInspectionItem

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <PageHeader
        title="检测项目管理"
        description="维护检测项目、执行标准、结果单位及启用状态"
      >
        <template v-if="canManage" #actions>
          <a-button type="primary" @click="openEditor()">
            新增检测项目
          </a-button>
        </template>
      </PageHeader>
      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a-input
          v-model:value="filters.keyword"
          allow-clear
          class="w-full sm:w-72"
          placeholder="项目编号、名称、分类或标准"
          @press-enter="search"
        />
        <a-select
          v-model:value="filters.status"
          class="w-full sm:w-40"
          :options="[
            { label: '全部状态', value: '' },
            { label: '启用', value: 'enabled' },
            { label: '停用', value: 'disabled' },
          ]"
        />
        <a-space>
          <a-button type="primary" :loading="loading" @click="search">查询</a-button>
          <a-button :disabled="loading" @click="reset">重置</a-button>
        </a-space>
      </div>
    </div>

    <div class="page-card overflow-hidden">
      <ConfigTable
        :columns="columns"
        :items="items as unknown as Record<string, unknown>[]"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :scroll-x="1250"
        @change="page = $event; load()"
      >
        <template #cell="{ column, record, value }">
          <a-select
            v-if="column.key === 'status' && canManage"
            :value="String(value || '')"
            class="w-24"
            size="small"
            :options="[
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ]"
            @change="changeStatus(row(record), $event as QualityItemStatus)"
          />
          <a-tag
            v-else-if="column.key === 'status'"
            :color="value === 'enabled' ? 'green' : 'default'"
          >
            {{ value === 'enabled' ? '启用' : '停用' }}
          </a-tag>
          <a-button
            v-else-if="column.key === 'actions' && canManage"
            type="link"
            size="small"
            @click="openEditor(row(record))"
          >
            编辑
          </a-button>
          <span v-else-if="column.key === 'actions'" class="text-slate-400">—</span>
          <OverflowTooltip v-else :content="value" />
        </template>
      </ConfigTable>
    </div>

    <QualityItemEditor
      v-model:open="editorOpen"
      :item="current"
      :saving="saving"
      @submit="save"
    />
  </section>
</template>
