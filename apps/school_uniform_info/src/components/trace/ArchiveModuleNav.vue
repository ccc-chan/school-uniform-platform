<script setup lang="ts">
export type ArchiveModule = 'product' | 'factory' | 'trace' | 'binding'
const model = defineModel<ArchiveModule>({ required: true })
const items = [
  { value: 'product', label: '产品信息' }, { value: 'factory', label: '工厂信息' },
  { value: 'trace', label: '溯源流程' }, { value: 'binding', label: '绑定信息' },
] as const
</script>
<template>
  <nav class="module-nav" aria-label="校服档案模块">
    <button v-for="item in items" :key="item.value" class="module-nav__item"
      :class="{ 'module-nav__item--active': model === item.value }" type="button" @click="model = item.value">
      <svg v-if="item.value === 'product'" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h14v14H5zM9 5v14M15 5v14" /></svg>
      <svg v-else-if="item.value === 'factory'" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 21V9l5 3V8l5 3V3h6v18M8 17h1m4 0h1m4 0h1" /></svg>
      <svg v-else-if="item.value === 'trace'" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 18 18 5m-7 0h7v7M5 6v12h12" /></svg>
      <svg v-else aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="7" r="3" /><path d="M6 20v-2a6 6 0 0 1 12 0v2m0-12 2 2 3-3" /></svg>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
<style scoped>
.module-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:5px;border:1px solid #dfe7f1;border-radius:15px;background:#fff;box-shadow:0 4px 14px rgb(31 60 96/4%)}.module-nav__item{display:grid;min-width:0;min-height:50px;padding:6px 2px;border:0;border-radius:11px;color:#6f7f96;background:transparent;font-size:11px;line-height:1.2;place-items:center}.module-nav__item svg{width:17px;height:17px;stroke:currentcolor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;fill:none}.module-nav__item--active{color:#0958d9;background:#eaf3ff;font-weight:700}.module-nav__item:focus-visible{outline:2px solid rgb(22 119 255/42%);outline-offset:1px}
</style>
