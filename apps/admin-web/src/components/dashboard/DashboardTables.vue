<script setup lang="ts">
import type { ActivityItem, RankingItem } from '@/types/dashboard'

defineProps<{
  activities: ActivityItem[]
  rankings: RankingItem[]
}>()

const activityColumns = [
  { title: '操作时间', dataIndex: 'time', key: 'time', width: 170 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 80 },
  { title: '操作内容', dataIndex: 'action', key: 'action', width: 120 },
  { title: '详情', dataIndex: 'detail', key: 'detail' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
]

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
</script>

<template>
  <section class="grid grid-cols-[1.45fr_1fr] gap-4">
    <div class="page-card pb-1">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="m-0 text-base font-700 text-slate-900">最新动态</h3>
        <a-button type="link" size="small">查看全部</a-button>
      </div>

      <a-table
        size="small"
        :columns="activityColumns"
        :data-source="activities"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '成功' ? 'success' : 'processing'">
              {{ record.status }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </div>

    <div class="page-card">
      <div class="mb-5 flex items-center justify-between">
        <h3 class="m-0 text-base font-700 text-slate-900">热门产品 TOP5</h3>
        <a-button type="link" size="small">查看全部</a-button>
      </div>

      <div class="grid grid-cols-[60px_1fr_100px] border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <span>排名</span>
        <span>产品名称</span>
        <span class="text-right">扫码次数</span>
      </div>
      <div
        v-for="(item, index) in rankings"
        :key="item.name"
        class="grid grid-cols-[60px_1fr_100px] items-center border-b border-slate-50 px-3 py-3 text-sm last:border-0"
      >
        <span
          class="h-7 w-7 flex items-center justify-center rounded-full text-xs font-700"
          :class="index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-500' : index === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-400'"
        >
          {{ index + 1 }}
        </span>
        <span class="text-slate-700">{{ item.name }}</span>
        <strong class="text-right text-slate-800">{{ formatValue(item.scans) }}</strong>
      </div>
    </div>
  </section>
</template>
