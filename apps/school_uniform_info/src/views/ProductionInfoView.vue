<script setup lang="ts">
import TraceDetailHeader from '@/components/trace/TraceDetailHeader.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info">
    <TraceDetailHeader
      title="生产流程"
      :to="{ name: 'school-uniform-info-home', params: { code: info.code } }"
    />

    <div class="px-5 py-6">
      <p class="m-0 text-3 font-600 tracking-widest text-thread">生产信息</p>
      <h2 class="mb-5 mt-2 text-6 font-700">从批次识别来源</h2>

      <section class="rounded-5 bg-white p-5 shadow-sm">
        <p class="m-0 text-3 text-muted">生产批次</p>
        <p class="mb-0 mt-2 font-mono text-5 font-700">
          {{ displayValue(info.productionBatch) }}
        </p>

        <div class="mt-5 border-t border-dashed border-ink/15 pt-5">
          <p class="m-0 text-3 text-muted">产品 SKU</p>
          <p class="mb-0 mt-2 text-4 font-600">
            {{ displayValue(info.productSku) }}
          </p>
        </div>
      </section>

      <p class="mt-5 rounded-4 bg-ink/5 p-4 text-3.25 leading-6 text-muted">
        当前先展示已有批次资料。生产环节、工序和时间节点将在后续接口中逐步补充。
      </p>
    </div>
  </div>
</template>
