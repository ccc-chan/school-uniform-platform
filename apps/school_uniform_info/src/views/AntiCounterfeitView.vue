<script setup lang="ts">
import { computed } from 'vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()

const isFirstScan = computed(() => info.value?.firstScan === true)
const scanSummary = computed(() =>
  isFirstScan.value
    ? '此码为首次扫描'
    : `此码已被扫描 ${info.value?.scanCount || 0} 次`,
)
</script>

<template>
  <div v-if="info" class="verify-page">
    <header class="detail-title">
      <RouterLink
        :to="{ name: 'school-uniform-info-home', params: { code: info.code } }"
        aria-label="返回溯源首页"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="m15 19-7-7 7-7" />
        </svg>
      </RouterLink>
      <h1>防伪验证</h1>
    </header>

    <section class="verify-result" :class="{ 'verify-result--repeat': !isFirstScan }">
      <span class="verify-result__icon">
        <svg v-if="isFirstScan" aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="m9 12 2 2 4-4m5.6-4A12 12 0 0 1 12 3 12 12 0 0 1 3.4 6 12 12 0 0 0 3 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3Z" />
        </svg>
        <svg v-else aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01M5 19h14a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0l-7 12A2 2 0 0 0 5 19Z" />
        </svg>
      </span>

      <h2>{{ isFirstScan ? '产品验证通过' : '该产品已验证' }}</h2>
      <p class="verify-result__summary">{{ scanSummary }}</p>
      <p v-if="!isFirstScan" class="verify-result__first-time">
        首次验证时间：{{ displayValue(info.firstScannedAt) }}
      </p>

      <dl class="verify-details">
        <div><dt>产品</dt><dd>{{ displayValue(info.productName) }}</dd></div>
        <div><dt>批次</dt><dd>{{ displayValue(info.productionBatch) }}</dd></div>
        <div><dt>追溯编码</dt><dd>{{ info.code }}</dd></div>
        <div><dt>本次验证</dt><dd>{{ displayValue(info.scannedAt) }}</dd></div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.verify-page {
  min-height: calc(100vh - 68px);
  background: #fff;
}

.detail-title {
  position: sticky;
  top: 42px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 20px;
  border-bottom: 1px solid #f1f5f9;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(10px);
}

.detail-title a {
  display: grid;
  width: 28px;
  height: 28px;
  color: #2563eb;
  place-items: center;
}

.detail-title svg {
  width: 21px;
  height: 21px;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.detail-title h1 {
  margin: 0;
  font-size: 16px;
}

.verify-result {
  padding: 42px 20px 32px;
  text-align: center;
}

.verify-result__icon {
  display: grid;
  width: 96px;
  height: 96px;
  margin: 0 auto 20px;
  border-radius: 28px;
  color: #16a34a;
  background: linear-gradient(145deg, #f0fdf4, #dcfce7);
  box-shadow: 0 12px 30px rgb(34 197 94 / 12%);
  place-items: center;
}

.verify-result--repeat .verify-result__icon {
  color: #d97706;
  background: linear-gradient(145deg, #fffbeb, #fef3c7);
  box-shadow: 0 12px 30px rgb(245 158 11 / 12%);
}

.verify-result__icon svg {
  width: 48px;
  height: 48px;
  stroke: currentcolor;
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.verify-result h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
}

.verify-result__summary {
  margin: 8px 0 0;
  color: #16a34a;
  font-size: 14px;
  font-weight: 650;
}

.verify-result--repeat .verify-result__summary {
  color: #d97706;
}

.verify-result__first-time {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.verify-details {
  margin: 26px 0 0;
  padding: 6px 20px;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  text-align: left;
  box-shadow: 0 1px 3px rgb(15 23 42 / 5%), 0 1px 2px rgb(15 23 42 / 5%);
}

.verify-details div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f8fafc;
}

.verify-details div:last-child {
  border-bottom: 0;
}

.verify-details dt {
  color: #64748b;
  font-size: 13px;
}

.verify-details dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 650;
  text-align: right;
}
</style>
