<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()

const isFirstScan = computed(() => info.value?.firstScan === true)
const scanSummary = computed(() =>
  isFirstScan.value
    ? '此码为首次扫描'
    : `此码已被扫描 ${info.value?.scanCount || 0} 次`,
)

const productImageFailed = shallowRef(false)
const productImageUrl = computed(() => info.value?.productImageUrl?.trim() || '')
const productDescription = computed(() =>
  [info.value?.category, info.value?.season, info.value?.style]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' · ') || '产品信息待补充',
)

watch(productImageUrl, () => {
  productImageFailed.value = false
})
</script>

<template>
  <div v-if="info" class="verify-page">
    <section class="verify-credential" :class="{ 'verify-credential--repeat': !isFirstScan }">
      <header class="verify-credential__header">
        <div>
          <span class="verify-credential__eyebrow">AUTHENTICITY CHECK</span>
          <h1>防伪验证</h1>
        </div>
        <span class="verify-credential__serial">数字身份凭证</span>
      </header>

      <div class="verify-credential__hero">
        <span class="verify-result__icon">
          <svg v-if="isFirstScan" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 3c-3 2-5 3-9 3v6c0 5 5 8 9 10 4-2 9-5 9-10V6c-4 0-6-1-9-3Z" />
            <path d="m8 12 3 3 5-5" />
          </svg>
          <svg v-else aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01M5 19h14a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0l-7 12A2 2 0 0 0 5 19Z" />
          </svg>
        </span>
        <p class="verify-result__status">该产品验证通过</p>
        <p class="verify-result__summary">{{ scanSummary }}</p>
        <p class="verify-result__first-time">
          首次扫码时间：{{ displayValue(info.firstScannedAt || info.scannedAt) }}
        </p>
      </div>

      <section class="verified-product" aria-label="已验证产品">
        <figure class="verified-product__image">
          <img
            v-if="productImageUrl && !productImageFailed"
            :src="productImageUrl"
            :alt="`${displayValue(info.productName)}产品图片`"
            @error="productImageFailed = true"
          />
          <span v-else>{{ productImageFailed ? '图片加载失败' : '暂无产品图片' }}</span>
        </figure>
        <div class="verified-product__content">
          <h3>{{ displayValue(info.productName) }}</h3>
          <p>{{ productDescription }}</p>
          <div class="verified-product__tags"><span>一物一码</span><span>追溯可查</span></div>
          <small>校服实物图仅用于产品识别，具体规格以产品档案为准。</small>
        </div>
        <RouterLink
          class="details-button"
          :to="{ name: 'school-uniform-info-home', params: { code: info.code } }"
        >
          <span>点击查看具体详情</span>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
        </RouterLink>
        <p class="verified-product__source">以下信息由校服溯源平台提供，可用于真伪核验与生产追踪。</p>
      </section>

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
  min-height: 100vh;
  padding: 18px 16px 32px;
  background:
    radial-gradient(circle at 100% 0, rgb(37 99 235 / 10%), transparent 34%),
    linear-gradient(180deg, #f7faff 0%, #eef4fb 100%);
}

.verify-credential {
  overflow: hidden;
  border: 1px solid rgb(22 119 255 / 18%);
  border-radius: 24px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 24px 60px rgb(30 64 175 / 12%);
  animation: credential-in 420ms ease-out both;
}

.verify-credential--repeat {
  border-color: rgb(22 119 255 / 18%);
}

.verify-credential__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #e9eff7;
}

.verify-credential__eyebrow {
  display: block;
  margin-bottom: 3px;
  color: #7c91ad;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.verify-credential__header h1 {
  margin: 0;
  color: #17304d;
  font-size: 18px;
}

.verify-credential__serial {
  padding: 6px 9px;
  border-radius: 999px;
  color: #2266c5;
  background: #edf5ff;
  font-size: 10px;
  font-weight: 650;
}

.verify-credential__hero {
  padding: 34px 20px 24px;
  text-align: center;
}

.verify-result__icon {
  display: grid;
  width: 82px;
  height: 82px;
  margin: 0 auto 18px;
  border: 8px solid var(--trace-primary-soft);
  border-radius: 50%;
  color: var(--trace-primary);
  background: #dceaf8;
  box-shadow: 0 0 0 1px var(--trace-primary-border), 0 12px 30px rgb(22 119 255 / 14%);
  place-items: center;
}

.verify-credential--repeat .verify-result__icon {
  border-color: var(--trace-primary-soft);
  color: var(--trace-primary);
  background: #dceaf8;
  box-shadow: 0 0 0 1px var(--trace-primary-border), 0 12px 30px rgb(22 119 255 / 14%);
}

.verify-result__icon svg {
  width: 38px;
  height: 38px;
  stroke: currentcolor;
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.verify-result__status {
  margin: 0;
  color: #17233b;
  font-size: 26px;
  font-weight: 750;
  line-height: 1.3;
}

.verify-credential--repeat .verify-result__status {
  color: #17233b;
}

.verify-result__summary {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.verify-credential--repeat .verify-result__summary {
  color: #64748b;
}

.verify-result__first-time {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.verified-product {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  margin: 0 20px;
  padding: 16px;
  border: 1px solid #dfe8f3;
  border-radius: 18px;
  background: #fff;
  text-align: left;
}

.verified-product__image {
  overflow: hidden;
  width: 92px;
  height: 112px;
  margin: 0;
  border-radius: 12px;
  background: #f0f4f8;
}

.verified-product__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.verified-product__image span {
  display: grid;
  width: 100%;
  height: 100%;
  padding: 8px;
  place-items: center;
  color: #8a97aa;
  font-size: 11px;
  text-align: center;
}

.verified-product__content {
  min-width: 0;
}

.verified-product__content h3 {
  margin: 2px 0 0;
  color: #17304d;
  font-size: 18px;
  overflow-wrap: anywhere;
}

.verified-product__content p {
  margin: 6px 0 0;
  color: #78879b;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.verified-product__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.verified-product__tags span {
  padding: 5px 10px;
  border-radius: 999px;
  color: #1677ff;
  background: #edf5ff;
  font-size: 10px;
  font-weight: 700;
}

.verified-product__content small {
  display: block;
  margin-top: 10px;
  color: #8a97aa;
  font-size: 10px;
  line-height: 1.5;
}

.verified-product .details-button {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  background: var(--trace-primary);
  box-shadow: 0 10px 22px rgb(22 119 255 / 18%);
}

.verified-product__source {
  grid-column: 1 / -1;
  margin: -2px 0 0;
  color: #7d8999;
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
}

.verify-details {
  margin: 28px 20px 0;
  padding: 4px 18px;
  border: 1px solid #e4ebf4;
  border-radius: 18px;
  background: #f9fbfe;
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

.details-button {
  display: flex;
  min-height: 50px;
  margin: 16px 20px 24px;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  background: var(--trace-primary);
  box-shadow: 0 12px 24px rgb(22 119 255 / 22%);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}

@keyframes credential-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .verify-credential { animation: none; }
}

.details-button svg {
  width: 17px;
  height: 17px;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
