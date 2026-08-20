<script setup lang="ts">
import { message } from 'ant-design-vue'
import { getOperationLogs } from '@/api/system'
import PageHeader from '@/components/common/PageHeader.vue'
import type { OperationLog } from '@/types/system'

const items = shallowRef<OperationLog[]>([])
const loading = shallowRef(false)
const detailOpen = shallowRef(false)
const current = shallowRef<OperationLog | null>(null)
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const filters = reactive({ keyword: '', module: '', startAt: '', endAt: '' })

async function load() {
  loading.value = true
  try {
    const result = await getOperationLogs({ ...filters, page: page.value, pageSize: pageSize.value })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '操作日志加载失败')
  } finally {
    loading.value = false
  }
}
function search() { page.value = 1; load() }
function showDetail(item: OperationLog) { current.value = item; detailOpen.value = true }
onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <PageHeader
        title="操作日志管理"
        description="查询系统关键操作与行为明细"
      />
      <div class="mt-5 flex flex-wrap gap-3">
        <a-input v-model:value="filters.keyword" allow-clear class="w-64" placeholder="操作行为、目标或 IP" @press-enter="search" />
        <a-select v-model:value="filters.module" allow-clear class="w-40" placeholder="全部模块" :options="[{ label: '产品中心', value: '产品中心' }, { label: '系统管理', value: '系统管理' }]" />
        <a-input v-model:value="filters.startAt" type="datetime-local" class="w-52" />
        <a-input v-model:value="filters.endAt" type="datetime-local" class="w-52" />
        <a-button type="primary" @click="search">查询</a-button>
      </div>
    </div>
    <div class="page-card overflow-hidden">
      <OperationLogTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @detail="showDetail"
        @page="page = $event; load()"
      />
    </div>
    <a-modal v-model:open="detailOpen" title="操作详情" :footer="null" class="responsive-modal">
      <a-descriptions v-if="current" :column="1" bordered size="small">
        <a-descriptions-item label="操作人">{{ current.operator }}</a-descriptions-item>
        <a-descriptions-item label="操作行为">{{ current.action }}</a-descriptions-item>
        <a-descriptions-item label="目标">{{ current.targetType }}<span v-if="current.targetId"> #{{ current.targetId }}</span></a-descriptions-item>
        <a-descriptions-item label="IP 地址">{{ current.ip }}</a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ current.createdAt }}</a-descriptions-item>
        <a-descriptions-item label="传入参数">
          <pre class="m-0 whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(current.detail?.request, null, 2) || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="返回参数">
          <pre class="m-0 whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(current.detail?.response, null, 2) || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item v-if="current.detail?.context" label="业务信息">
          <pre class="m-0 whitespace-pre-wrap break-all text-xs">{{ JSON.stringify(current.detail.context, null, 2) }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </section>
</template>
