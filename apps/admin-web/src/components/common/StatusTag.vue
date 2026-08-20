<script setup lang="ts">
import { computed } from 'vue'
import {
  ENABLED_STATUS_MAP,
  type StatusPresentationMap,
} from '@/constants/status'

const props = withDefaults(
  defineProps<{
    value?: string | null
    map?: StatusPresentationMap
    fallback?: string
  }>(),
  {
    value: '',
    map: () => ENABLED_STATUS_MAP,
    fallback: '-',
  },
)

const presentation = computed(() => {
  const value = String(props.value || '')
  return (
    props.map[value] ?? {
      label: value || props.fallback,
      color: 'default',
    }
  )
})
</script>

<template>
  <a-tag :color="presentation.color">
    {{ presentation.label }}
  </a-tag>
</template>
