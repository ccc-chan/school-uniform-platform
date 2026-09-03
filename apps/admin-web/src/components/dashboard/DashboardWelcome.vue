<script setup lang="ts">
const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())
</script>

<template>
  <section class="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr]">
    <div
      class="relative min-h-44 overflow-hidden rounded-4 border border-blue-100 bg-gradient-to-r from-[#edf5ff] via-[#e8f2ff] to-[#dceaff] px-5 py-6 shadow-sm sm:px-7 lg:px-9 lg:py-7"
    >
      <div class="relative z-1">
        <div class="text-xs text-blue-600">{{ today }}</div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <h2 class="m-0 text-5 font-700 text-slate-900 sm:text-6">
            欢迎回来，超级管理员
          </h2>
          <span
            class="rounded-full bg-blue-600 px-3 py-1 text-[11px] text-white"
          >
            品牌管理
          </span>
        </div>
        <p class="mb-0 mt-3 max-w-[70%] text-sm text-slate-500 sm:max-w-none">
          校服数字身份平台，为每一件校服建立可信的数字身份证
        </p>
      </div>

      <div
        class="absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border-12 border-blue-200/45 bg-blue-500/10 shadow-[0_15px_45px_rgba(37,99,235,0.18)] sm:right-10 sm:h-32 sm:w-32"
      >
        <div
          class="absolute inset-4 flex items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-400 to-blue-700 text-8 font-700 text-white shadow-lg sm:inset-5 sm:rounded-[28px] sm:text-11"
        >
          ✓
        </div>
      </div>
      <div
        class="absolute right-0 top-[-5rem] h-64 w-64 rounded-full border border-white/70"
      />
    </div>
  </section>
</template>

<style scoped>
.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
}

.quick-icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 18px;
  transition: transform 0.2s ease;
}

.quick-action:hover .quick-icon {
  transform: translateY(-2px);
}
</style>
