<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'
import type { StudentBindingInput } from '@/api/school_uniform_info'
import StudentBindingForm from '@/components/student/StudentBindingForm.vue'
import StudentBindingResult from '@/components/student/StudentBindingResult.vue'

const {
  code, qrCodeType, studentBinding, bindingLoading, bindingLoaded,
  bindingError, bindingSaving, bindingSubmitError, loadStudentBinding, bindStudent,
} = useSchoolUniformInfoViewModel()
const justBound = shallowRef(false)

onBeforeRouteLeave(() => { justBound.value = false })

onMounted(() => {
  if (!bindingLoading.value) void loadStudentBinding()
})

async function submit(value: StudentBindingInput) {
  justBound.value = await bindStudent(value)
}
</script>

<template>
  <div class="student-page">
    <section v-if="qrCodeType !== 'product'" class="student-state">
      <h1>暂不支持绑定</h1>
      <p>仅一品一码支持绑定学生信息。</p>
    </section>
    <section v-else-if="bindingLoading" class="student-state" role="status">
      <p>正在查询学生信息…</p>
    </section>
    <section v-else-if="bindingError" class="student-state" role="alert">
      <h1>学生信息加载失败</h1>
      <p>{{ bindingError }}</p>
      <button class="retry-button" type="button" @click="loadStudentBinding">重新查询</button>
    </section>
    <StudentBindingResult v-else-if="studentBinding" :binding="studentBinding" :code="code" :just-bound="justBound" />
    <StudentBindingForm v-else-if="bindingLoaded" :saving="bindingSaving" :error="bindingSubmitError" @submit="submit" />
  </div>
</template>

<style scoped>
.student-page { min-height: 70vh; padding: 24px 16px 32px; background: #f5f7fa; }
.student-state { padding: 48px 12px; text-align: center; }
.student-state h1 { font-size: 22px; }
.student-state p { margin: 16px 0; color: #64748b; line-height: 1.7; }
.retry-button { padding: 12px 24px; border: 0; border-radius: 12px; background: #2563a9; color: #fff; cursor: pointer; }
</style>
