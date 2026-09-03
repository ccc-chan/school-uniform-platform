<script setup lang="ts">
import TraceEntryLink from './TraceEntryLink.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info" class="trace-home">
    <section class="product-visual product-visual--compact" aria-label="产品图片占位">
      <span class="product-visual__icon">👕</span>
      <span class="product-visual__caption">校服产品档案</span>
    </section>

    <header class="product-heading">
      <span class="trace-badge">一批一码</span>
      <h1>{{ displayValue(info.productName) }}</h1>
      <p>款号 {{ displayValue(info.style || info.productCode) }}</p>
    </header>

    <section class="batch-summary">
      <span class="batch-summary__tag">批次溯源</span>
      <dl>
        <div><dt>生产批次</dt><dd>{{ displayValue(info.productionBatch) }}</dd></div>
        <div><dt>产品编码</dt><dd>{{ displayValue(info.productCode) }}</dd></div>
        <div><dt>执行标准</dt><dd>{{ displayValue(info.executionStandard) }}</dd></div>
      </dl>
    </section>

    <section class="trace-actions" aria-label="批次溯源入口">
      <TraceEntryLink icon="quality" label="查看检测报告" :to="{ name: 'school-uniform-info-quality', params: { code: info.code } }" />
      <TraceEntryLink icon="production" label="查看生产流程" :to="{ name: 'school-uniform-info-production', params: { code: info.code } }" />
      <TraceEntryLink icon="verify" label="防伪验证" :to="{ name: 'school-uniform-info-verify', params: { code: info.code } }" />
    </section>
  </div>
</template>
