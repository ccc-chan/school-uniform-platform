<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const descriptions = {
  product: '查看款式、面料与产品资料',
  quality: '查看质量检测相关资料',
  production: '了解生产节点与加工记录',
  verify: '查询这件校服的身份信息',
}

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
        <path d="m9 3 1-2h4l1 2 2 1 2-.2 2 3.4-1.2 1.8v3l1.2 1.8-2 3.4-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3.4L4.2 12V9L3 7.2l2-3.4L7 4Z" transform="translate(0 1)" />
        <circle cx="12" cy="11.5" r="3.5" />
      </svg>
      <svg v-else-if="icon === 'quality'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z" />
      </svg>
      <svg v-else aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M12 3c-3 2-5 3-9 3v6c0 5 5 8 9 10 4-2 9-5 9-10V6c-4 0-6-1-9-3Z" />
        <path d="m8 12 3 3 5-5" />
      </svg>
    </span>
    <span class="trace-entry__content">
      <span class="trace-entry__label">{{ label }}</span>
      <span class="trace-entry__description">{{ descriptions[icon] }}</span>
    </span>
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
  padding: 17px 16px;
  border: 1px solid #e2eaf3;
  border-radius: 18px;
  color: #1e293b;
  background: #fff;
  box-shadow: 0 4px 14px rgb(30 58 95 / 4%);
  text-decoration: none;
  transition: transform 150ms ease, border-color 150ms ease;
}

.trace-entry:active {
  transform: scale(0.985);
}

.trace-entry__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
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
.trace-entry__icon--quality,
.trace-entry__icon--production,
.trace-entry__icon--verify {
  color: var(--trace-primary);
  background: var(--trace-primary-soft);
}

.trace-entry__content {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 5px;
}

.trace-entry__description {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.trace-entry__label {
  font-size: 15px;
  font-weight: 650;
}

.trace-entry__arrow {
  width: 16px;
  height: 16px;
  color: #cbd5e1;
}
</style>
