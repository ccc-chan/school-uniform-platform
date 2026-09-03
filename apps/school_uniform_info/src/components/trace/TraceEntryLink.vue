<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  icon: 'product' | 'production' | 'quality' | 'verify'
  label: string
  to: RouteLocationRaw
}>()
</script>

<template>
  <RouterLink :to="to" class="trace-entry">
    <span class="trace-entry__icon" :class="`trace-entry__icon--${icon}`">
      <svg v-if="icon === 'product'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <svg v-else-if="icon === 'production'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <svg v-else-if="icon === 'quality'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z" />
      </svg>
      <svg v-else aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" />
      </svg>
    </span>
    <span class="trace-entry__label">{{ label }}</span>
    <svg class="trace-entry__arrow" aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" />
    </svg>
  </RouterLink>
</template>

<style scoped>
.trace-entry {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  color: #1e293b;
  background: #fff;
  box-shadow: 0 1px 3px rgb(15 23 42 / 5%), 0 1px 2px rgb(15 23 42 / 5%);
  text-decoration: none;
  transition: transform 150ms ease, border-color 150ms ease;
}

.trace-entry:active {
  transform: scale(0.985);
}

.trace-entry__icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 12px;
  place-items: center;
}

.trace-entry__icon svg,
.trace-entry__arrow {
  width: 20px;
  height: 20px;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trace-entry__icon--product,
.trace-entry__icon--quality {
  color: #2563eb;
  background: #eff6ff;
}

.trace-entry__icon--production {
  color: #d97706;
  background: #fffbeb;
}

.trace-entry__icon--verify {
  color: #7c3aed;
  background: #f5f3ff;
}

.trace-entry__label {
  flex: 1;
  font-size: 14px;
  font-weight: 650;
}

.trace-entry__arrow {
  width: 16px;
  height: 16px;
  color: #cbd5e1;
}
</style>
