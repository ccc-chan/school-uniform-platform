<script setup lang="ts">
import { computed } from 'vue'
import TraceEntryLink from './TraceEntryLink.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const archiveRibbonUrl = `${import.meta.env.BASE_URL}images/archive-design-reference.png`

const { info, displayValue } = useSchoolUniformInfoViewModel()

const facts = computed(() => {
  const item = info.value
  if (!item) return []
  return [
    ['面料', displayValue(item.fabricInfo)],
    ['尺码范围', item.sizes.length ? item.sizes.join(' / ') : '暂无'],
    ['颜色', displayValue(item.color)],
  ]
})
</script>

<template>
  <div v-if="info" class="trace-home trace-home--product">
    <section class="product-visual product-visual--archive" aria-label="校服数字档案">
      <div
        class="archive-ribbon"
        :style="{ backgroundImage: `url(${archiveRibbonUrl})` }"
        aria-hidden="true"
      />
      <div class="archive-brand">
        <strong>SU</strong>
        <span>守护成长的每一件</span>
      </div>
      <p class="archive-title">校服数字档案</p>
      <header class="product-heading">
        <span class="trace-badge">一品一码</span>
        <h1>{{ displayValue(info.productName) }}</h1>
        <p>款号 {{ displayValue(info.style || info.productCode) }}</p>
      </header>
    </section>

    <div class="archive-content">
    <h2 class="trace-section-title">基本信息</h2>
    <dl class="trace-facts">
      <div v-for="[label, value] in facts" :key="label">
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>

    <h2 class="trace-section-title trace-section-title--spaced">溯源资料</h2>
    <section class="trace-actions" aria-label="产品溯源入口">
      <TraceEntryLink icon="quality" label="检测报告" :to="{ name: 'school-uniform-info-quality', params: { code: info.code } }" />
      <TraceEntryLink icon="production" label="生产流程" :to="{ name: 'school-uniform-info-production', params: { code: info.code } }" />
      <TraceEntryLink icon="verify" label="防伪验证" :to="{ name: 'school-uniform-info-verify', params: { code: info.code } }" />
    </section>

    <p class="trace-footnote">本次查询已记录，用于校服数字身份核验</p>
    </div>
  </div>
</template>

<style scoped>
.trace-home--product {
  padding: 0;
  background: var(--trace-primary);
}

.product-visual--archive {
  display: block;
  height: auto;
  min-height: calc(var(--archive-unit) * 620);
  margin: 0;
  padding: calc(var(--archive-unit) * 300) calc(var(--archive-unit) * 58) calc(var(--archive-unit) * 70);
  border: 0;
  border-radius: 0;
  background: var(--trace-primary);
}

.product-heading {
  min-width: 0;
  padding: 0;
}

.product-heading h1 {
  margin-top: calc(var(--archive-unit) * 22);
  color: #fff;
  font-size: calc(var(--archive-unit) * 96);
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
  padding: calc(var(--archive-unit) * 66) calc(var(--archive-unit) * 58) calc(var(--archive-unit) * 60);
  border-radius: calc(var(--archive-unit) * 42) calc(var(--archive-unit) * 42) 0 0;
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
  content: "";
  width: calc(var(--archive-unit) * 44);
  height: 1px;
  margin-top: calc(var(--archive-unit) * 6);
  background: #fff;
}

.archive-title {
  position: absolute;
  top: calc(var(--archive-unit) * 186);
  left: calc(var(--archive-unit) * 236);
  margin: 0;
  color: #fff;
  font-size: calc(var(--archive-unit) * 64);
  font-weight: 750;
  line-height: 1.25;
  white-space: nowrap;
}

.archive-ribbon {
  position: absolute;
  inset: 0 0 auto 76%;
  height: calc(var(--archive-unit) * 578);
  z-index: -1;
  background-size: calc(var(--archive-unit) * 853) auto;
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
</style>
