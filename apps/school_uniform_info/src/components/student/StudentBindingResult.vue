<script setup lang="ts">
import type { StudentBinding } from '@/api/school_uniform_info'

defineProps<{ binding: StudentBinding; code: string; justBound: boolean }>()
</script>

<template>
  <section class="binding-result" aria-live="polite">
    <header class="result-header">
      <span class="success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="m6.5 12.5 3.5 3.5 7.5-8" /></svg>
      </span>
      <div>
        <span class="result-eyebrow">身份绑定完成</span>
        <h1 class="result-title">{{ justBound ? '绑定成功' : '已绑定学生' }}</h1>
        <p class="result-description">这件校服已绑定到学生“{{ binding.studentName }}”</p>
      </div>
    </header>
    <dl class="student-card">
      <div class="student-card__identity"><dt>校服身份码</dt><dd>{{ code }}</dd></div>
      <div class="student-card__cell"><dt>学生</dt><dd>{{ binding.studentName }}</dd><span>{{ [binding.grade, binding.className].filter(Boolean).join(' ') || '班级待补充' }}</span></div>
      <div class="student-card__cell"><dt>家长</dt><dd>{{ binding.parentName }}</dd><span>{{ binding.phoneMasked }}</span></div>
      <div class="student-card__time"><dt>绑定时间</dt><dd>{{ binding.boundAt || '暂无' }}</dd></div>
    </dl>
    <div class="privacy-note">
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
      <span>家长手机号已脱敏保护</span>
    </div>
  </section>
</template>

<style scoped>
.binding-result { display: grid; gap: 14px; }
.result-header { display: flex; align-items: center; gap: 13px; padding: 4px 2px 2px; }
.success-icon { display: grid; width: 48px; height: 48px; flex: 0 0 48px; border-radius: 15px; color: #149566; background: #e2f7ed; box-shadow: inset 0 0 0 1px rgb(20 149 102 / 8%); place-items: center; }
.success-icon svg { width: 27px; height: 27px; stroke: currentcolor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.result-eyebrow { color: #149566; font-size: 10px; font-weight: 700; letter-spacing: .08em; }
.result-title { margin: 2px 0 0; color: #172236; font-size: 20px; font-weight: 750; line-height: 1.35; }
.result-description { margin: 3px 0 0; color: #77869c; font-size: 11px; line-height: 1.55; overflow-wrap: anywhere; }
.student-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin: 0; font-size: 12px; }
.student-card > div { min-width: 0; border-radius: 11px; }
.student-card dt { color: #7e8da3; font-size: 10px; }
.student-card dd { min-width: 0; margin: 4px 0 0; color: #203753; font-weight: 700; overflow-wrap: anywhere; }
.student-card__identity { grid-column: 1 / -1; padding: 11px 12px; border: 1px solid #d7e7fa; background: #f2f7ff; }
.student-card__identity dd { color: #0958d9; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; letter-spacing: .015em; }
.student-card__cell { min-height: 78px; padding: 11px 12px; border: 1px solid #e5eaf1; background: #fff; }
.student-card__cell dd { font-size: 14px; }
.student-card__cell span { display: block; margin-top: 5px; color: #75849a; font-size: 11px; overflow-wrap: anywhere; }
.student-card__time { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; background: #f7f9fc; }
.student-card__time dd { margin: 0; text-align: right; }
.privacy-note { display: flex; align-items: center; gap: 7px; color: #64748b; font-size: 11px; }
.privacy-note svg { width: 16px; height: 16px; flex: 0 0 16px; color: #149566; stroke: currentcolor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
