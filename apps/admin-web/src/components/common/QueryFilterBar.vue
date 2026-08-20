<script setup lang="ts">
withDefaults(
  defineProps<{
    loading: boolean
    actionsAtEnd?: boolean
    resetFirst?: boolean
  }>(),
  {
    actionsAtEnd: false,
    resetFirst: false,
  },
)

const emit = defineEmits<{
  search: []
  reset: []
}>()
</script>

<template>
  <a-form class="query-filter-bar" layout="inline">
    <slot />

    <a-form-item
      class="query-filter-bar__actions"
      :class="{ 'query-filter-bar__actions--end': actionsAtEnd }"
    >
      <a-space>
        <a-button
          v-if="resetFirst"
          :disabled="loading"
          @click="emit('reset')"
        >
          重置
        </a-button>
        <a-button
          type="primary"
          :loading="loading"
          @click="emit('search')"
        >
          查询
        </a-button>
        <a-button
          v-if="!resetFirst"
          :disabled="loading"
          @click="emit('reset')"
        >
          重置
        </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<style scoped>
.query-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.query-filter-bar :deep(.ant-form-item) {
  margin: 0;
}

.query-filter-bar__actions--end {
  margin-inline-start: auto;
}

@media (max-width: 639px) {
  .query-filter-bar__actions {
    width: 100%;
  }

  .query-filter-bar__actions--end {
    margin-inline-start: 0;
  }
}
</style>
