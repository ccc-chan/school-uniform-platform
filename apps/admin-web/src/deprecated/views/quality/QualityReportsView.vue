<script setup lang="ts">
import { message } from 'ant-design-vue'
import { getQualityOptions, getQualityReportBlob } from '@/api/quality'
import QualityReportFilters from '@/components/quality/QualityReportFilters.vue'
import QualityReportTable from '@/components/quality/QualityReportTable.vue'
import { useQualityReports } from '@/composables/useQualityReports'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const state = useQualityReports()
const productOptions = shallowRef<Array<{ label: string; value: number }>>([])

const canCreate = computed(() => auth.hasPermission('quality.report.create'))
const canDownload = computed(() => auth.hasPermission('quality.report.download'))

async function loadInitialData() {
  try {
    const [, options] = await Promise.all([state.load(), getQualityOptions()])
    productOptions.value = options.products.map((item) => ({
      label: `${item.code} · ${item.name}`,
      value: item.id,
    }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测报告加载失败')
  }
}

async function preview(id: number) {
  try {
    const blob = await getQualityReportBlob(id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '报告文件打开失败')
  }
}

onMounted(loadInitialData)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="page-title">检测报告列表</h2>
          <p class="mb-0 mt-2 text-secondary">
            统一管理产品检测报告、审核状态及有效期限
          </p>
        </div>
        <a-button
          v-if="canCreate"
          type="primary"
          @click="router.push('/quality/reports/upload')"
        >
          上传检测报告
        </a-button>
      </div>

      <div class="mt-5">
        <QualityReportFilters
          v-model:keyword="state.filters.keyword"
          v-model:product-id="state.filters.productId"
          v-model:status="state.filters.status"
          v-model:start-date="state.filters.startDate"
          v-model:end-date="state.filters.endDate"
          :product-options="productOptions"
          :loading="state.loading.value"
          @search="state.search"
          @reset="state.reset"
        />
      </div>
    </div>

    <div class="page-card overflow-hidden">
      <QualityReportTable
        :items="state.items.value"
        :loading="state.loading.value"
        :total="state.total.value"
        :page="state.page.value"
        :page-size="state.pageSize.value"
        :can-download="canDownload"
        @page="state.setPage"
        @view="router.push(`/quality/reports/${$event.id}`)"
        @preview="preview($event.id)"
      />
    </div>
  </section>
</template>
