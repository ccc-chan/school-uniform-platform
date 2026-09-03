<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  to: RouteLocationRaw
}>()
</script>

<template>
  <header class="detail-title">
    <RouterLink
      :to="to"
      class="detail-title__back"
      aria-label="返回溯源首页"
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="m15 19-7-7 7-7" />
      </svg>
    </RouterLink>
    <h1>{{ title }}</h1>
  </header>
</template>

<style scoped>
.detail-title {
  position: sticky;
  top: 42px;
  z-index: 5;
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid #f1f5f9;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(10px);
}

.detail-title__back {
  display: grid;
  width: 28px;
  height: 28px;
  color: #2563eb;
  place-items: center;
}

.detail-title__back svg {
  width: 21px;
  height: 21px;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.detail-title h1 {
  margin: 0;
  font-size: 16px;
}
</style>
