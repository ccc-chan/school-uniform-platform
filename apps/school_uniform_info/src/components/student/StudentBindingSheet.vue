<script setup lang="ts">
import StudentBindingForm from './StudentBindingForm.vue'
import type { StudentBindingInput } from '@/api/school_uniform_info'
defineProps<{ saving: boolean; error: string }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ submit: [value: StudentBindingInput] }>()
</script>
<template>
  <Teleport to="body"><Transition name="binding-sheet">
    <div v-if="open" class="binding-sheet" role="dialog" aria-modal="true" aria-label="绑定这件校服" @click.self="open = false">
      <section class="binding-sheet__panel"><div class="binding-sheet__handle" aria-hidden="true" />
        <button class="binding-sheet__close" type="button" aria-label="关闭" @click="open = false">×</button>
        <StudentBindingForm :saving="saving" :error="error" @submit="emit('submit', $event)" />
      </section>
    </div>
  </Transition></Teleport>
</template>
<style scoped>
.binding-sheet{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;background:rgb(24 39 61/42%)}.binding-sheet__panel{position:relative;width:min(100%,480px);max-height:min(88vh,760px);overflow-y:auto;border-radius:22px 22px 0 0;background:#fff;box-shadow:0 -16px 48px rgb(17 37 66/18%);overscroll-behavior:contain}.binding-sheet__handle{width:42px;height:4px;margin:9px auto 0;border-radius:999px;background:#d7dfeb}.binding-sheet__close{position:absolute;top:14px;right:14px;z-index:1;display:grid;width:30px;height:30px;border:0;border-radius:9px;color:#7f8da1;background:#f1f5f9;font-size:20px;line-height:1;place-items:center}.binding-sheet :deep(.binding-form){padding-top:18px;border-radius:0}.binding-sheet-enter-active,.binding-sheet-leave-active{transition:opacity 180ms ease}.binding-sheet-enter-active .binding-sheet__panel,.binding-sheet-leave-active .binding-sheet__panel{transition:transform 220ms ease}.binding-sheet-enter-from,.binding-sheet-leave-to{opacity:0}.binding-sheet-enter-from .binding-sheet__panel,.binding-sheet-leave-to .binding-sheet__panel{transform:translateY(100%)}
</style>
