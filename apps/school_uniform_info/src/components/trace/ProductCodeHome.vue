<script setup lang="ts">
import { computed } from 'vue'
import TraceEntryLink from './TraceEntryLink.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

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
  <div v-if="info" class="trace-home">
    <section class="product-visual" aria-label="产品图片占位">
      <span class="product-visual__icon">👕</span>
      <span class="product-visual__caption">校服产品档案</span>
    </section>

    <header class="product-heading">
      <span class="trace-badge">一品一码</span>
      <h1>{{ displayValue(info.productName) }}</h1>
      <p>款号 {{ displayValue(info.style || info.productCode) }}</p>
    </header>

    <dl class="trace-facts">
      <div v-for="[label, value] in facts" :key="label">
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>

    <section class="trace-actions" aria-label="产品溯源入口">
      <TraceEntryLink icon="quality" label="查看检测报告" :to="{ name: 'school-uniform-info-quality', params: { code: info.code } }" />
      <TraceEntryLink icon="production" label="查看生产流程" :to="{ name: 'school-uniform-info-production', params: { code: info.code } }" />
      <TraceEntryLink icon="verify" label="防伪验证" :to="{ name: 'school-uniform-info-verify', params: { code: info.code } }" />
    </section>

    <p class="trace-footnote">本次查询已记录，用于校服数字身份核验</p>
  </div>
</template>
