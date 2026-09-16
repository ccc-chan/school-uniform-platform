<script setup lang="ts">
import QrManagementFilters from '@/features/qrcodes/management/QrManagementFilters.vue'
import QrManagementTable from '@/features/qrcodes/management/QrManagementTable.vue'
import QrStudentBindingModal from '@/features/qrcodes/management/QrStudentBindingModal.vue'
import { useQrManagement } from '@/features/qrcodes/management/useQrManagement'
import type { QrManagementItem } from '@/api/qr-management'
import { useAuthStore } from '@/stores/auth'

const {
  filters,
  items,
  loading,
  error,
  saving,
  editing,
  page,
  pageSize,
  total,
  metrics,
  search,
  reset,
  save,
  setPage,
  load,
} = useQrManagement()

const authStore = useAuthStore()
</script>

<template>
  <section class="qr-management">
    <header>
      <h2 class="page-title">二维码管理</h2>
      <p class="qr-management__subtitle">管理校服二维码、学生绑定及扫码数据</p>
    </header>

    <div class="qr-management__metrics" :aria-busy="loading">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="qr-management__metric"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value?.toLocaleString() ?? '—' }}</strong>
        <small>{{ metric.hint }}</small>
      </article>
    </div>

    <div class="qr-management__filters">
      <QrManagementFilters
        :filters="filters"
        :loading="loading"
        @update:filters="Object.assign(filters, $event)"
        @search="search"
        @reset="reset"
      />
    </div>

    <a-alert v-if="error" :message="error" type="error" show-icon>
      <template #action
        ><a-button size="small" :loading="loading" @click="load()"
          >重试</a-button
        ></template
      >
    </a-alert>

    <QrManagementTable
      :items="items as unknown as QrManagementItem[]"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :can-create="authStore.hasPermission('qr.management.bind')"
      :can-edit="authStore.hasPermission('qr.management.bind')"
      @bind="editing = $event"
      @page="setPage"
      @update:page="page = $event"
      @update:page-size="pageSize = $event"
      @refresh="search"
    />

    <QrStudentBindingModal
      v-if="editing"
      :key="editing.id"
      :item="editing"
      :saving="saving"
      @close="editing = null"
      @save="save"
    />
  </section>
</template>

<style scoped>
.qr-management {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1600px;
  margin: 0 auto;
  padding-bottom: 16px;
}
.qr-management__subtitle {
  margin: 6px 0 0;
  color: #8492a8;
  font-size: 13px;
}
.qr-management__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.qr-management__metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}
.qr-management__metric span {
  color: #8492a8;
  font-size: 13px;
}
.qr-management__metric strong {
  color: #18243b;
  font-size: 28px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.qr-management__metric small {
  color: #16a36a;
  font-size: 12px;
}
.qr-management__filters {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}
@media (max-width: 1100px) {
  .qr-management__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .qr-management__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
