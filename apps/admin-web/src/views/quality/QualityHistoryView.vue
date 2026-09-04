<script setup lang="ts">
import { message } from 'ant-design-vue'
import { getQualityHistory, type QualityHistory } from '@/api/quality'
import ConfigTable from '@/components/common/ConfigTable.vue'
import OverflowTooltip from '@/components/common/OverflowTooltip.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import type { ConfigTableColumn } from '@/components/common/types'
import { QUALITY_REPORT_STATUS_MAP } from '@/constants/status'

const items = shallowRef<QualityHistory[]>([])
const loading = shallowRef(false)
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const filters = reactive({
  keyword: '',
  action: '',
  startDate: '',
  endDate: '',
})

const columns: ConfigTableColumn[] = [
  { title: '记录编号', dataIndex: 'id', key: 'id', width: 105 },
  { title: '业务编号', dataIndex: 'targetNo', key: 'targetNo', width: 190 },
  { title: '操作类型', dataIndex: 'action', key: 'action', width: 190 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 115 },
  { title: '说明', dataIndex: 'note', key: 'note', width: 220 },
  { title: '操作人员', dataIndex: 'operator', key: 'operator', width: 180 },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 145 },
  { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
]

async function load() {
  loading.value = true
  try {
    const result = await getQualityHistory({
      ...filters,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测历史加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  Object.assign(filters, {
    keyword: '',
    action: '',
    startDate: '',
    endDate: '',
  })
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <div>
        <h2 class="page-title">检测历史记录</h2>
        <p class="mb-0 mt-2 text-secondary">
          查询检测报告上传、审核、文件访问及检测项目维护记录
        </p>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <a-input
          v-model:value="filters.keyword"
          allow-clear
          class="w-full sm:w-64"
          placeholder="操作类型或业务对象"
          @press-enter="search"
        />
        <a-select
          v-model:value="filters.action"
          class="w-full sm:w-48"
          :options="[
            { label: '全部操作', value: '' },
            { label: '上传检测报告', value: '上传检测报告' },
            { label: '审核通过', value: '审核通过检测报告' },
            { label: '驳回报告', value: '驳回检测报告' },
            { label: '下载检测报告', value: '下载检测报告' },
            { label: '新增检测项目', value: '新增检测项目' },
            { label: '编辑检测项目', value: '编辑检测项目' },
          ]"
        />
        <div class="flex w-full items-center gap-2 sm:w-auto">
          <a-input
            v-model:value="filters.startDate"
            type="date"
            aria-label="开始日期"
          />
          <span class="text-slate-400">至</span>
          <a-input
            v-model:value="filters.endDate"
            type="date"
            aria-label="结束日期"
          />
        </div>
        <a-space>
          <a-button type="primary" :loading="loading" @click="search"
            >查询</a-button
          >
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
        :scroll-x="1300"
        @change="
          page = $event
          load()
        "
      >
        <template #cell="{ column, value }">
          <StatusTag
            v-if="column.key === 'status'"
            :value="String(value || '')"
            :map="QUALITY_REPORT_STATUS_MAP"
          />
          <OverflowTooltip v-else :content="value" />
        </template>
      </ConfigTable>
    </div>
  </section>
</template>
