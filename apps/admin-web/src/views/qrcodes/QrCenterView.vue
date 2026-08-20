<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import type { QrOverviewItem } from '@/api/qrcodes'
import QrMetrics from '@/components/qrcodes/QrMetrics.vue'
import QrOverviewFilters from '@/components/qrcodes/QrOverviewFilters.vue'
import QrOverviewTable from '@/components/qrcodes/QrOverviewTable.vue'
import { useQrOverview } from '@/composables/useQrOverview'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const {
  items,
  metrics,
  loading,
  total,
  page,
  pageSize,
  filters,
  load,
  setFilters,
  search,
  reset,
  setPage,
} = useQrOverview()

async function safe(action: () => Promise<void>, fallback: string) {
  try {
    await action()
  } catch (error) {
    message.error(error instanceof Error ? error.message : fallback)
  }
}

function showDetails(item: QrOverviewItem) {
  Modal.info({
    title: item.productName || '二维码汇总详情',
    content: `产品编号：${item.productCode || '-'}；二维码总量：${item.total.toLocaleString('zh-CN')}；已绑定：${Number(item.bound || 0).toLocaleString('zh-CN')}；未绑定：${Number(item.unbound || 0).toLocaleString('zh-CN')}；已作废：${Number(item.voided || 0).toLocaleString('zh-CN')}`,
    okText: '关闭',
  })
}

onMounted(() => safe(load, '二维码数据加载失败'))
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="page-title">二维码中心</h2>
        <p class="mb-0 mt-2 text-secondary">管理二维码生成、绑定及产品分布</p>
      </div>
      <a-space wrap>
        <a-button
          v-if="auth.hasPermission('qrcode.bind')"
          @click="router.push('/qrcodes/bind')"
        >
          二维码绑定
        </a-button>
        <a-button
          v-if="auth.hasPermission('qrcode.batch_generate')"
          @click="router.push('/qrcodes/batch-generate')"
        >
          批量生成
        </a-button>
        <a-button
          v-if="auth.hasPermission('qrcode.generate')"
          type="primary"
          @click="router.push('/qrcodes/generate')"
        >
          生成二维码
        </a-button>
      </a-space>
    </div>

    <QrMetrics :metrics="metrics" />

    <div class="page-card">
      <QrOverviewFilters
        :filters="filters"
        :loading="loading"
        @update:filters="setFilters"
        @search="safe(search, '查询失败')"
        @reset="safe(reset, '重置失败')"
      />
    </div>

    <div class="page-card overflow-hidden">
      <QrOverviewTable
        :items="items"
        :loading="loading"
        :permissions="auth.permissions"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @page="safe(() => setPage($event), '分页加载失败')"
        @view="showDetails"
      />
    </div>
  </section>
</template>
