<script setup lang="ts">
import QueryFilterBar from '@/components/common/QueryFilterBar.vue'
import type { ConfigOption } from '@/components/common/types'

defineProps<{
  keyword: string
  status: string
  statusOptions: ConfigOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:status': [value: string]
  search: []
  reset: []
}>()
</script>

<template>
  <QueryFilterBar
    :loading="loading"
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <a-input
      :value="keyword"
      allow-clear
      class="w-full lg:w-72"
      placeholder="输入编号、名称或负责人"
      @press-enter="emit('search')"
      @update:value="emit('update:keyword', $event)"
    />
    <a-select
      :value="status"
      :options="[{ label: '全部状态', value: '' }, ...statusOptions]"
      class="w-full lg:w-44"
      @update:value="emit('update:status', String($event || ''))"
    />
  </QueryFilterBar>
</template>
