<script setup lang="ts">
import { computed } from 'vue'
import TraceEntryLink from './TraceEntryLink.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()
const schoolName = computed(() => info.value?.applicableSchools[0] || '适用学校待补充')
</script>

<template>
  <div v-if="info" class="trace-home trace-home--school">
    <header class="school-heading">
      <span class="school-heading__mark">校</span>
      <div>
        <span class="trace-badge">一校一码</span>
        <h1>{{ schoolName }}</h1>
        <p>校服产品溯源信息</p>
      </div>
    </header>

    <section class="school-product">
      <div>
        <span>关联校服产品</span>
        <h2>{{ displayValue(info.productName) }}</h2>
        <p>{{ displayValue(info.productCode) }} · {{ displayValue(info.productionBatch) }}</p>
      </div>
      <span class="school-product__status">已验证</span>
    </section>

    <dl class="trace-facts">
      <div><dt>款式</dt><dd>{{ displayValue(info.style) }}</dd></div>
      <div><dt>适用季节</dt><dd>{{ displayValue(info.season) }}</dd></div>
      <div><dt>执行标准</dt><dd>{{ displayValue(info.executionStandard) }}</dd></div>
    </dl>

    <section class="trace-actions" aria-label="学校溯源入口">
      <TraceEntryLink icon="quality" label="查看检测报告" :to="{ name: 'school-uniform-info-quality', params: { code: info.code } }" />
      <TraceEntryLink icon="production" label="查看生产流程" :to="{ name: 'school-uniform-info-production', params: { code: info.code } }" />
      <TraceEntryLink icon="verify" label="防伪验证" :to="{ name: 'school-uniform-info-verify', params: { code: info.code } }" />
    </section>
  </div>
</template>
