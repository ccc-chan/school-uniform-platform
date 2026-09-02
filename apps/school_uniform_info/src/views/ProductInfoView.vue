<script setup lang="ts">
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info, displayValue } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info" class="px-5 py-6">
    <p class="m-0 text-3 font-600 tracking-widest text-thread">产品资料</p>
    <h2 class="mb-5 mt-2 text-6 font-700">这件校服是什么</h2>

    <dl class="m-0 overflow-hidden rounded-5 bg-white px-5 shadow-sm">
      <div
        v-for="[label, value] in [
          ['产品名称', info.productName],
          ['产品编码', info.productCode],
          ['产品 SKU', info.productSku],
          ['品类', info.category],
          ['适用季节', info.season],
          ['款式', info.style],
          ['颜色', info.color],
        ]"
        :key="label"
        class="flex gap-5 border-b border-ink/8 py-4 last:border-b-0"
      >
        <dt class="w-22 shrink-0 text-3.5 text-muted">{{ label }}</dt>
        <dd class="m-0 flex-1 text-right text-3.5 font-600">
          {{ displayValue(value) }}
        </dd>
      </div>
    </dl>
  </div>
</template>
