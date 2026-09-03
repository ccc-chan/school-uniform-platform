<script setup lang="ts">
import TraceDetailHeader from '@/components/trace/TraceDetailHeader.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info">
    <TraceDetailHeader
      title="检测报告"
      :to="{ name: 'school-uniform-info-home', params: { code: info.code } }"
    />

    <div class="px-5 py-6">
      <p class="m-0 text-3 font-600 tracking-widest text-thread">质量信息</p>
      <h2 class="mb-5 mt-2 text-6 font-700">用什么标准检验</h2>

      <section class="rounded-5 bg-white p-5 shadow-sm">
        <div>
          <p class="m-0 text-3 text-muted">执行标准</p>
          <p class="mb-0 mt-2 text-4.5 font-700 leading-7">
            {{ displayValue(info.executionStandard) }}
          </p>
        </div>

        <div class="mt-5 border-t border-dashed border-ink/15 pt-5">
          <p class="m-0 text-3 text-muted">面料信息</p>
          <p class="mb-0 mt-2 whitespace-pre-line text-3.5 leading-6">
            {{ displayValue(info.fabricInfo) }}
          </p>
        </div>
      </section>

      <p class="mt-5 rounded-4 bg-verify/8 p-4 text-3.25 leading-6 text-verify">
        当前展示产品执行标准和面料资料；具体检测报告将在质量数据接口完善后接入。
      </p>
    </div>
  </div>
</template>
