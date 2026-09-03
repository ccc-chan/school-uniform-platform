<script setup lang="ts">
import ProductionTimeline from '@/components/trace/ProductionTimeline.vue'
import TraceDetailHeader from '@/components/trace/TraceDetailHeader.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'

const { info } = useSchoolUniformInfoViewModel()
</script>

<template>
  <div v-if="info">
    <TraceDetailHeader
      title="生产流程"
      :to="{ name: 'school-uniform-info-home', params: { code: info.code } }"
    />

    <ProductionTimeline
      :batch-no="info.productionBatch || ''"
      :production-date="info.productionDate || ''"
      :factory-name="info.productionFactoryName || ''"
      :steps="info.productionSteps"
    />
  </div>
</template>
