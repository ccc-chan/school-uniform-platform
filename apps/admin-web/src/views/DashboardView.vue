<script setup lang="ts">
import { getDashboardOverview } from '@/api/dashboard'
import type { DashboardData } from '@/types/dashboard'

const dashboard = shallowRef<DashboardData | null>(null)
const loading = shallowRef(true)
const errorMessage = shallowRef('')

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    dashboard.value = await getDashboardOverview()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '首页数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="mx-auto max-w-400">
    <a-alert
      v-if="errorMessage"
      class="mb-4"
      type="error"
      show-icon
      :message="errorMessage"
    >
      <template #action>
        <a-button size="small" danger @click="loadDashboard">
          重新加载
        </a-button>
      </template>
    </a-alert>

    <a-spin :spinning="loading" tip="首页数据加载中">
      <div v-if="dashboard" class="space-y-4">
        <DashboardWelcome />
        <DashboardMetrics :items="dashboard.metrics" />
        <DashboardCharts
          :scan-points="dashboard.scanPoints"
          :qr-statuses="dashboard.qrStatuses"
        />
        <DashboardTables
          :activities="dashboard.activities"
          :rankings="dashboard.rankings"
        />

        <footer class="py-2 text-center text-xs text-slate-400">
          Copyright © 2026 校服数字身份平台 All Rights Reserved.
        </footer>
      </div>
    </a-spin>
  </div>
</template>
