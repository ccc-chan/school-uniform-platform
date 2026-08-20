<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  content: unknown
}>()

const contentRef = useTemplateRef<HTMLSpanElement>('contentRef')
const open = ref(false)
const text = computed(() =>
  props.content === null || props.content === undefined || props.content === ''
    ? '-'
    : String(props.content),
)

function handleMouseEnter() {
  const element = contentRef.value
  open.value = Boolean(element && element.scrollWidth > element.clientWidth)
}

function handleMouseLeave() {
  open.value = false
}
</script>

<template>
  <a-tooltip :open="open" :title="text">
    <span
      ref="contentRef"
      v-bind="$attrs"
      class="block min-w-0 truncate"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      {{ text }}
    </span>
  </a-tooltip>
</template>
