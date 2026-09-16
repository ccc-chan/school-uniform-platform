<script setup lang="ts">
import type { StudentBinding } from '@/api/school_uniform_info'

defineProps<{ binding: StudentBinding; code: string; justBound: boolean }>()
</script>

<template>
  <section class="binding-result" aria-live="polite">
    <header class="result-header">
      <span class="success-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none"><path d="m8 16 6 8L25 7" /></svg>
      </span>
      <h1 class="result-title">{{ justBound ? '绑定成功' : '学生信息' }}</h1>
      <p class="result-description">这件校服已成功绑定到学生“{{ binding.studentName }}”。<br />家长手机号已脱敏保护。</p>
    </header>
    <dl class="student-card">
      <div><dt>校服身份</dt><dd>{{ code }}</dd></div>
      <div><dt>学生</dt><dd>{{ binding.studentName }} <span class="class-name">{{ [binding.grade, binding.className].filter(Boolean).join(' ') }}</span></dd></div>
      <div><dt>家长</dt><dd>{{ binding.parentName }} <span class="phone">{{ binding.phoneMasked }}</span></dd></div>
      <div><dt>绑定时间</dt><dd>{{ binding.boundAt || '暂无' }}</dd></div>
    </dl>
    <RouterLink class="archive-button" :to="{ name: 'school-uniform-info-home', params: { code } }">查看校服数字档案</RouterLink>
    <p class="result-footnote">后续再次扫码，可查看校服数字档案及学生信息</p>
  </section>
</template>

<style scoped>
.result-header { text-align: center; }
.success-icon { display: grid; width: 68px; height: 68px; margin: 0 auto; border-radius: 50%; background: #dff5e9; color: #128953; place-items: center; }
.success-icon svg { width: 34px; height: 34px; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.result-title { margin: 20px 0 14px; font-size: 24px; font-weight: 700; }
.result-description { margin: 0 0 16px; color: #60718f; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.student-card { display: grid; gap: 6px; margin: 0 0 18px; padding: 22px 18px; border-radius: 18px; background: #fff; font-size: 13px; line-height: 1.6; }
.student-card div { display: flex; align-items: baseline; gap: 6px; }
.student-card dt { flex-shrink: 0; color: #60718f; }
.student-card dd { min-width: 0; margin: 0; color: #152038; font-weight: 650; overflow-wrap: anywhere; }
.class-name, .phone { margin-left: 8px; }
.archive-button { display: grid; min-height: 48px; padding: 8px 16px; border-radius: 12px; color: #fff; background: #2563a9; font-size: 17px; font-weight: 700; text-decoration: none; place-items: center; }
.result-footnote { margin: 16px 0 0; color: #8795ab; font-size: 11px; text-align: center; line-height: 1.7; }
</style>
