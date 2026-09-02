<script setup lang="ts">
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, statusLabel, displayValue } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info" class="px-5 py-6">
    <section class="rounded-5 bg-white p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="m-0 text-3 font-600 tracking-widest text-muted">
            VERIFIED GARMENT
          </p>
          <h2 class="mb-0 mt-2 text-6 font-700 leading-tight">
            {{ displayValue(info.productName) }}
          </h2>
        </div>

        <span
          class="shrink-0 rounded-full bg-verify/10 px-3 py-1.5 text-3 font-600 text-verify"
        >
          {{ statusLabel }}
        </span>
      </div>

      <div class="mt-6 border-t border-dashed border-ink/15 pt-5">
        <p class="m-0 text-2.75 tracking-widest text-muted">数字身份编号</p>
        <p class="mb-0 mt-2 break-all font-mono text-4.5 font-700">
          {{ info.code }}
        </p>
      </div>
    </section>

    <section class="mt-5 grid grid-cols-2 gap-3">
      <RouterLink
        :to="{ name: 'school-uniform-info-product' }"
        class="rounded-4 bg-ink p-4 text-white no-underline"
      >
        <span class="text-2.75 text-white/55">PRODUCT</span>
        <strong class="mt-8 block text-4.5">查看产品资料</strong>
      </RouterLink>

      <RouterLink
        :to="{ name: 'school-uniform-info-quality' }"
        class="rounded-4 border border-ink/10 bg-white p-4 text-ink no-underline"
      >
        <span class="text-2.75 text-muted">QUALITY</span>
        <strong class="mt-8 block text-4.5">查看质量信息</strong>
      </RouterLink>
    </section>

    <p class="mb-2 mt-6 text-center text-3 text-muted">
      本次查询已记录，用于校服数字身份核验
    </p>
  </div>
</template>
