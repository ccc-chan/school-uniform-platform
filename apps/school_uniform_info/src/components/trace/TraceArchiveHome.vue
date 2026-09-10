<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import TraceEntryLink from './TraceEntryLink.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, qrCodeType, traceTypeLabel, displayValue } =
  useSchoolUniformInfoViewModel()

const imageFailed = shallowRef(false)
const productImageUrl = computed(() => info.value?.productImageUrl || '')

watch(productImageUrl, () => {
  imageFailed.value = false
})

const title = computed(() =>
  qrCodeType.value === 'school'
    ? info.value?.applicableSchools[0]?.trim() || '适用学校待补充'
    : displayValue(info.value?.productName),
)

const subtitle = computed(() =>
  qrCodeType.value === 'school'
    ? `关联校服 ${displayValue(info.value?.productName)}`
    : `款号 ${displayValue(info.value?.style || info.value?.productCode)}`,
)

const factsTitle = computed(() => {
  if (qrCodeType.value === 'batch') return '批次信息'
  if (qrCodeType.value === 'school') return '关联校服信息'
  return '基本信息'
})

const entryLabel = computed(() => {
  if (qrCodeType.value === 'batch') return '批次溯源入口'
  if (qrCodeType.value === 'school') return '学校溯源入口'
  return '产品溯源入口'
})

const facts = computed(() => {
  const item = info.value
  if (!item) return []
  if (qrCodeType.value === 'batch') {
    return [
      ['生产批次', displayValue(item.productionBatch)],
      ['产品编码', displayValue(item.productCode)],
      ['执行标准', displayValue(item.executionStandard)],
    ]
  }
  if (qrCodeType.value === 'school') {
    return [
      ['关联校服', displayValue(item.productName)],
      ['产品编码', displayValue(item.productCode)],
      ['生产批次', displayValue(item.productionBatch)],
      ['款式', displayValue(item.style)],
      ['适用季节', displayValue(item.season)],
      ['执行标准', displayValue(item.executionStandard)],
    ]
  }
  return [
    ['面料', displayValue(item.fabricInfo)],
    ['尺码范围', item.sizes.length ? item.sizes.join(' / ') : '暂无'],
    ['颜色', displayValue(item.color)],
  ]
})
</script>

<template>
  <div v-if="info" class="trace-home trace-home--archive passport-home">
    <header class="passport-brand">
      <strong>SU</strong>
      <span>守护成长的每一件</span>
    </header>
    <section class="passport-product" aria-label="校服数字档案">
      <figure class="passport-photo">
        <img
          v-if="productImageUrl && !imageFailed"
          :src="productImageUrl"
          :alt="`${displayValue(info.productName)}产品图片`"
          @error="imageFailed = true"
        />
        <span v-else class="passport-photo-empty">
          {{ imageFailed ? '图片加载失败' : '暂无产品图片' }}
        </span>
      </figure>
      <header class="product-heading">
        <span class="trace-badge">{{ traceTypeLabel }}</span>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </header>
    </section>

    <div class="passport-body">
      <section class="passport-panel">
      <h2 class="trace-section-title">{{ factsTitle }}</h2>
      <dl
        class="trace-facts"
        :class="{ 'trace-facts--rows': qrCodeType !== 'product' }"
      >
        <div v-for="[label, value] in facts" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
      </section>

      <section class="passport-panel">
      <h2 class="trace-section-title">溯源服务</h2>
      <section class="trace-actions" :aria-label="entryLabel">
        <TraceEntryLink
          icon="quality"
          label="检测报告"
          :to="{
            name: 'school-uniform-info-quality',
            params: { code: info.code },
          }"
        />
        <TraceEntryLink
          icon="production"
          label="生产流程"
          description="查看生产记录"
          :to="{
            name: 'school-uniform-info-production',
            params: { code: info.code },
          }"
        />
        <TraceEntryLink
          icon="verify"
          label="防伪验证"
          description="查询校服身份"
          :to="{
            name: 'school-uniform-info-verify',
            params: { code: info.code },
          }"
        />
      </section>

      </section>

      <p class="trace-footnote">本次查询已记录，用于校服数字身份核验</p>
    </div>
  </div>
</template>

<style scoped>
.trace-home--archive {
  padding: 0;
  background: var(--trace-primary);
}

.product-visual--archive {
  display: block;
  height: auto;
  min-height: calc(var(--archive-unit) * 510);
  margin: 0;
  padding: calc(var(--archive-unit) * 210) calc(var(--archive-unit) * 58)
    calc(var(--archive-unit) * 42);
  border: 0;
  border-radius: 0;
  background: var(--trace-primary);
}

.product-heading {
  min-width: 0;
}

.product-heading h1 {
  margin-top: calc(var(--archive-unit) * 22);
  color: #fff;
  font-size: calc(var(--archive-unit) * 60);
  line-height: 1.15;
}

.product-heading p {
  margin-top: calc(var(--archive-unit) * 12);
  color: #fff;
  font-size: calc(var(--archive-unit) * 34);
  overflow-wrap: anywhere;
}

.product-heading .trace-badge {
  padding: calc(var(--archive-unit) * 8) calc(var(--archive-unit) * 24);
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 999px;
  color: #fff;
  background: transparent;
  font-size: calc(var(--archive-unit) * 28);
  font-weight: 500;
}

.archive-content {
  padding: calc(var(--archive-unit) * 66) calc(var(--archive-unit) * 58)
    calc(var(--archive-unit) * 60);
  border-radius: calc(var(--archive-unit) * 42) calc(var(--archive-unit) * 42) 0
    0;
  background: #fff;
}

.trace-section-title {
  color: #172b4d;
  font-size: calc(var(--archive-unit) * 44);
  font-weight: 700;
}

.trace-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: calc(var(--archive-unit) * 40) 0 0;
  border: 0;
  border-radius: 0;
  background: #fff;
}

.trace-facts div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: calc(var(--archive-unit) * 12);
  padding: 0 calc(var(--archive-unit) * 16);
  align-items: center;
  border-right: 1px solid #e2eaf3;
  border-bottom: 0;
}

.trace-facts div:last-child {
  border-right: 0;
}

.trace-facts dt {
  font-size: calc(var(--archive-unit) * 30);
}

.trace-facts dd {
  font-size: calc(var(--archive-unit) * 34);
  text-align: center;
}

.trace-actions {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.trace-actions :deep(.trace-entry) {
  min-height: calc(var(--archive-unit) * 176);
  padding: calc(var(--archive-unit) * 30) 0;
  border: 0;
  border-bottom: 1px solid #edf0f5;
  border-radius: 0;
  color: #172b4d;
  background: #fff;
  box-shadow: none;
}

.trace-actions :deep(.trace-entry:last-child) {
  border-bottom: 0;
}

.trace-actions :deep(.trace-entry__arrow) {
  color: #7d8ca3;
}

.trace-actions :deep(.trace-entry__label) {
  font-size: calc(var(--archive-unit) * 34);
}

.trace-actions :deep(.trace-entry__icon) {
  width: calc(var(--archive-unit) * 98);
  height: calc(var(--archive-unit) * 98);
  flex-basis: calc(var(--archive-unit) * 98);
}

.trace-actions :deep(.trace-entry__description) {
  line-height: 1.6;
}

.product-visual--archive {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.archive-brand {
  position: absolute;
  top: calc(var(--archive-unit) * 60);
  left: calc(var(--archive-unit) * 58);
  display: grid;
  gap: calc(var(--archive-unit) * 12);
  color: #fff;
}

.archive-brand strong {
  font-family: Arial, sans-serif;
  font-size: calc(var(--archive-unit) * 42);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.08em;
}

.archive-brand span {
  font-size: calc(var(--archive-unit) * 18);
  letter-spacing: 0.42em;
}

.archive-brand::after {
  content: '';
  width: calc(var(--archive-unit) * 44);
  height: 1px;
  margin-top: calc(var(--archive-unit) * 6);
  background: #fff;
}

.archive-ribbon {
  position: absolute;
  inset: 0 0 0 76%;
  z-index: -1;
  background-size: 100% 100%;
  background-position: right top;
  background-repeat: no-repeat;
}

.product-heading {
  position: relative;
  max-width: 76%;
}

.product-heading .trace-badge {
  margin-bottom: 0;
  line-height: 1.25;
}

.archive-content {
  position: relative;
  margin-top: calc(var(--archive-unit) * -42);
}

.trace-section-title {
  margin-bottom: 0;
  line-height: 1.25;
}

.trace-section-title--spaced {
  margin-top: calc(var(--archive-unit) * 88);
}

.trace-facts div {
  min-height: calc(var(--archive-unit) * 116);
  justify-content: center;
}

.trace-facts dd {
  font-weight: 500;
}

.trace-section-title + .trace-actions {
  margin-top: calc(var(--archive-unit) * 16);
}

.trace-actions :deep(.trace-entry) {
  gap: calc(var(--archive-unit) * 42);
}

.trace-actions :deep(.trace-entry__icon) {
  border-radius: calc(var(--archive-unit) * 20);
}

.trace-actions :deep(.trace-entry__icon svg) {
  width: calc(var(--archive-unit) * 48);
  height: calc(var(--archive-unit) * 48);
}

.trace-actions :deep(.trace-entry__arrow) {
  width: calc(var(--archive-unit) * 28);
  height: calc(var(--archive-unit) * 28);
}

.trace-actions :deep(.trace-entry__content) {
  gap: calc(var(--archive-unit) * 8);
}

.trace-actions :deep(.trace-entry__description) {
  font-size: calc(var(--archive-unit) * 28);
  line-height: 1.4;
}

.trace-footnote {
  margin-top: calc(var(--archive-unit) * 100);
  font-size: calc(var(--archive-unit) * 24);
  line-height: 1.5;
}
.trace-facts--rows {
  grid-template-columns: minmax(0, 1fr);
}

.trace-facts--rows div {
  display: grid;
  grid-template-columns: 5em minmax(0, 1fr);
  gap: 16px;
  padding: 16px 0;
  border-right: 0;
  border-bottom: 1px solid #e2eaf3;
}

.trace-facts--rows div:last-child {
  border-bottom: 0;
}

.trace-facts--rows dd {
  min-width: 0;
  text-align: left;
  overflow-wrap: anywhere;
}

.passport-home {
  min-height: calc(
    100vh - var(--archive-unit) * 150 - env(safe-area-inset-bottom)
  );
  background: #f5f7fb;
}
.passport-brand {
  position: relative; overflow: hidden; display: grid; gap: 4px;
  padding: 24px 24px 48px; color: #fff; background: var(--trace-primary);
}
.passport-brand strong { font-size: 28px; line-height: 1; font-weight: 750; }
.passport-brand span { font-size: 15px; }
.passport-brand::after {
  content: "";
  position: absolute;
  top: -82px;
  right: 58px;
  width: 48px;
  height: 230px;
  border-radius: 999px;
  background: rgb(255 255 255 / 11%);
  box-shadow: 76px 0 0 rgb(255 255 255 / 9%);
  transform: rotate(36deg);
  pointer-events: none;
}
.passport-product {
  position: relative; display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.86fr); gap: 16px;
  margin: -28px 14px 14px; padding: 10px; border-radius: 16px;
  background: #fff; box-shadow: 0 8px 24px rgb(25 65 110 / 4%);
}
.passport-photo {
  position: relative; overflow: hidden; min-width: 0; margin: 0;
  border-radius: 12px; background: #e9f3ff;
}
.passport-photo img {
  display: block; width: 100%; height: 100%; min-height: 180px;
  aspect-ratio: 4 / 5; object-fit: cover;
}
.passport-photo figcaption {
  position: absolute; bottom: 0; left: 0; padding: 4px 6px;
  border-radius: 0 8px 0 0; color: #64748b;
  background: rgb(255 255 255 / 85%); font-size: 10px;
}
.passport-home .product-heading { align-self: center; max-width: none; padding: 12px 8px 12px 0; }
.passport-home .product-heading h1 { margin-top: 14px; color: #101b32; font-size: clamp(22px, 6vw, 30px); line-height: 1.3; }
.passport-home .product-heading p { margin-top: 12px; color: #7c879a; font-size: 14px; }
.passport-home .product-heading .trace-badge {
  padding: 6px 12px; border: 0; color: var(--trace-primary);
  background: #e6f1ff; font-size: 13px; font-weight: 650;
}
.passport-body { display: grid; gap: 14px; padding: 0 14px 16px; }
.passport-panel { min-width: 0; padding: 18px 16px; border-radius: 16px; background: #fff; }
.passport-home .trace-section-title { margin: 0 0 14px; font-size: 20px; }
.passport-home .trace-facts { padding: 0; }
.passport-home .trace-facts div { min-height: 54px; }
.passport-home .trace-facts dt,
.passport-home .trace-facts dd { font-size: 14px; }
.passport-home .trace-facts--rows div { grid-template-columns: 5em minmax(0, 1fr); padding: 14px 0; }
.passport-home .trace-facts--rows dd { text-align: right; }
.passport-home .trace-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 0; }
.passport-home .trace-actions :deep(.trace-entry) {
  min-width: 0; min-height: 68px; gap: 8px; padding: 12px 8px;
  border: 1px solid #e9edf4; border-radius: 12px; color: #101b32;
}
.passport-home .trace-actions :deep(.trace-entry:first-child) {
  grid-column: 1 / -1; min-height: 72px; padding: 14px 12px;
  border-color: transparent; background: #f0f6ff;
}
.passport-home .trace-actions :deep(.trace-entry__icon) {
  width: 30px; height: 34px; flex-basis: 30px; border-radius: 0; background: transparent;
}
.passport-home .trace-actions :deep(.trace-entry__icon svg) { width: 30px; height: 30px; }
.passport-home .trace-actions :deep(.trace-entry__content) { gap: 4px; }
.passport-home .trace-actions :deep(.trace-entry__label) { font-size: 14px; }
.passport-home .trace-actions :deep(.trace-entry__description) { font-size: 11px; line-height: 1.4; }
.passport-home .trace-actions :deep(.trace-entry__arrow) { width: 12px; height: 16px; flex-shrink: 0; color: var(--trace-primary); }
.passport-home .trace-footnote { margin: 0; font-size: 11px; line-height: 1.5; }
.passport-photo-empty {
  display: grid;
  min-height: 180px;
  height: 100%;
  padding: 16px;
  place-items: center;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}
</style>
