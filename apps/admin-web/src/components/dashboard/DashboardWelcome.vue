<script setup lang="ts">
const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())
</script>

<template>
  <section class="grid grid-cols-[1.9fr_1fr] gap-4">
    <div class="relative min-h-44 overflow-hidden rounded-4 border border-blue-100 bg-gradient-to-r from-[#edf5ff] via-[#e8f2ff] to-[#dceaff] px-9 py-7 shadow-sm">
      <div class="relative z-1">
        <div class="text-xs text-blue-600">{{ today }}</div>
        <div class="mt-4 flex items-center gap-3">
          <h2 class="m-0 text-6 font-700 text-slate-900">
            欢迎回来，超级管理员
          </h2>
          <span class="rounded-full bg-blue-600 px-3 py-1 text-[11px] text-white">
            品牌管理
          </span>
        </div>
        <p class="mb-0 mt-3 text-sm text-slate-500">
          校服数字身份平台，为每一件校服建立可信的数字身份证
        </p>
      </div>

      <div class="absolute right-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border-12 border-blue-200/45 bg-blue-500/10 shadow-[0_15px_45px_rgba(37,99,235,0.18)]">
        <div class="absolute inset-5 flex items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-400 to-blue-700 text-11 font-700 text-white shadow-lg">
          ✓
        </div>
      </div>
      <div class="absolute right-0 top-[-5rem] h-64 w-64 rounded-full border border-white/70" />
    </div>

    <div class="page-card flex flex-col justify-between">
      <div class="flex items-center justify-between">
        <h3 class="m-0 text-base font-700 text-slate-900">快捷操作</h3>
        <span class="text-xs text-slate-400">常用功能</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <button class="quick-action" type="button">
          <span class="quick-icon bg-blue-50 text-blue-600">▣</span>
          <span>新增产品</span>
        </button>
        <button class="quick-action" type="button">
          <span class="quick-icon bg-orange-50 text-orange-500">⌗</span>
          <span>生成二维码</span>
        </button>
        <button class="quick-action" type="button">
          <span class="quick-icon bg-teal-50 text-teal-600">⌁</span>
          <span>批量绑定</span>
        </button>
        <button class="quick-action" type="button">
          <span class="quick-icon bg-red-50 text-red-500">▤</span>
          <span>打印标签</span>
        </button>
        <button class="quick-action" type="button">
          <span class="quick-icon bg-indigo-50 text-indigo-600">▥</span>
          <span>上传检测</span>
        </button>
        <button class="quick-action" type="button">
          <span class="quick-icon bg-purple-50 text-purple-600">▧</span>
          <span>数据报表</span>
        </button>
      </div>
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
