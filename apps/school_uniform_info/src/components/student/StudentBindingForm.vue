<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import type { StudentBindingInput } from '@/api/school_uniform_info'

const props = defineProps<{ saving: boolean; error: string }>()
const emit = defineEmits<{ submit: [value: StudentBindingInput] }>()
const form = reactive<StudentBindingInput>({
  studentName: '', studentNo: '', grade: '', className: '',
  parentName: '', parentRelation: '爸爸', phone: '', parentAuthorized: false,
})
const gradeGroups = [
  {
    label: '小学',
    options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  },
  {
    label: '初中',
    options: ['初一级', '初二级', '初三级'],
  },
  {
    label: '高中',
    options: ['高一级', '高二级', '高三级'],
  },
] as const
const relations = ['爸爸', '妈妈', '其他监护人'] as const
const validationError = shallowRef('')
const gradeMenuOpen = shallowRef(false)

function selectGrade(grade: string) {
  form.grade = grade
  gradeMenuOpen.value = false
}

function submit() {
  if (props.saving) return
  validationError.value = ''
  if (![form.studentName, form.studentNo, form.parentName].every((value) => value.trim())) {
    validationError.value = '请填写学生姓名、学生编号和家长姓名'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
    validationError.value = '请输入有效的11位手机号'
    return
  }
  if (!form.parentAuthorized) {
    validationError.value = '请确认信息真实并同意绑定'
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <form class="binding-form" :aria-busy="saving" @submit.prevent="submit">
    <h1 class="form-title">绑定信息</h1>
    <p class="form-description">填写学生及家长信息，为这件校服绑定学生身份。</p>
    <fieldset class="form-fields" :disabled="saving">
      <label class="field">学生姓名 <span class="required">*</span>
        <input v-model="form.studentName" required maxlength="100" placeholder="请输入学生姓名" autocomplete="off" />
      </label>
      <label class="field">学生编号 <span class="required">*</span>
        <input v-model="form.studentNo" required maxlength="100" placeholder="请输入学校提供的学生编号" autocomplete="off" />
      </label>
      <div class="class-fields">
        <div class="field grade-field">
          <span>年级</span>
          <button
            class="grade-trigger"
            :class="{ 'grade-trigger--placeholder': !form.grade }"
            type="button"
            :aria-expanded="gradeMenuOpen"
            @click="gradeMenuOpen = !gradeMenuOpen"
            @keydown.esc="gradeMenuOpen = false"
          >
            <span>{{ form.grade || '请选择年级' }}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" /></svg>
          </button>
          <div v-if="gradeMenuOpen" class="grade-menu">
            <section v-for="group in gradeGroups" :key="group.label">
              <h3>{{ group.label }}</h3>
              <div class="grade-options">
                <button
                  v-for="grade in group.options"
                  :key="grade"
                  type="button"
                  :class="{ selected: form.grade === grade }"
                  @click="selectGrade(grade)"
                >
                  {{ grade }}
                </button>
              </div>
            </section>
          </div>
        </div>
        <label class="field">班级
          <input v-model="form.className" maxlength="100" placeholder="请输入班级" />
        </label>
      </div>
      <fieldset class="relation-field">
        <legend>我是学生的</legend>
        <div class="relation-options">
          <label v-for="relation in relations" :key="relation" class="relation-option" :class="{ selected: form.parentRelation === relation }">
            <input v-model="form.parentRelation" type="radio" name="parentRelation" :value="relation" />
            <span>{{ relation }}</span>
          </label>
        </div>
      </fieldset>
      <label class="field">家长姓名 <span class="required">*</span>
        <input v-model="form.parentName" required maxlength="100" placeholder="请输入家长姓名" autocomplete="name" />
      </label>
      <label class="field">家长手机号 <span class="required">*</span>
        <input v-model="form.phone" required type="tel" inputmode="tel" pattern="1[3-9][0-9]{9}" maxlength="11" placeholder="请输入家长手机号码" autocomplete="tel" />
      </label>
      <label class="consent">
        <input v-model="form.parentAuthorized" type="checkbox" required />
        <span>我确认以上信息真实有效，同意将该二维码与学生及家长信息绑定。手机号将受到隐私保护，不向普通扫码人员公开完整号码。</span>
      </label>
      <p v-if="validationError || error" class="form-error" role="alert">{{ validationError || error }}</p>
      <button class="submit-button" type="submit">{{ saving ? '正在绑定…' : '确认绑定' }}</button>
    </fieldset>
    <p class="form-footnote">一个二维码对应一件校服，仅允许绑定一个学生身份</p>
  </form>
</template>

<style scoped>
.binding-form { padding: 24px 18px 20px; border-radius: 20px; background: #fff; }
.form-title { margin: 0; font-size: 24px; font-weight: 700; }
.form-description { margin: 10px 0 24px; color: #7b89a0; font-size: 13px; line-height: 1.7; }
.form-fields, .relation-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.form-fields { display: grid; gap: 16px; }
.field, .relation-field legend { color: #172236; font-size: 13px; font-weight: 650; }
.required { color: #e64949; }
.field input { display: block; box-sizing: border-box; width: 100%; min-width: 0; height: 46px; margin-top: 8px; padding: 0 13px; border: 1px solid #d5deeb; border-radius: 11px; background: #fff; color: #172236; font-size: 14px; font-weight: 400; }
.field input::placeholder { color: #96a2b5; }
.field input:focus { outline: 2px solid #b8d6ff; outline-offset: 1px; border-color: #2563a9; }
.class-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.grade-field { position: relative; min-width: 0; }
.grade-trigger { display: flex; box-sizing: border-box; width: 100%; min-width: 0; height: 46px; margin-top: 8px; padding: 0 12px 0 13px; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #d5deeb; border-radius: 11px; background: #fff; color: #172236; font-size: 14px; font-weight: 400; text-align: left; }
.grade-trigger--placeholder { color: #96a2b5; }
.grade-trigger:focus-visible { outline: 2px solid #b8d6ff; outline-offset: 1px; border-color: #2563a9; }
.grade-trigger svg { flex: 0 0 auto; width: 18px; height: 18px; fill: none; stroke: currentcolor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
.grade-menu { position: absolute; z-index: 10; top: calc(100% + 8px); left: 0; box-sizing: border-box; width: calc(200% + 10px); padding: 14px; border: 1px solid #cfdef0; border-radius: 14px; background: #fff; box-shadow: 0 16px 40px rgb(30 64 110 / 18%); }
.grade-menu section + section { margin-top: 14px; }
.grade-menu h3 { margin: 0 0 8px; color: #66758d; font-size: 12px; font-weight: 700; }
.grade-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.grade-options button { min-width: 0; min-height: 40px; padding: 7px 4px; border: 1px solid #d5deeb; border-radius: 9px; background: #fff; color: #33445f; font-size: 13px; line-height: 1.25; }
.grade-options button.selected { border-color: #2563a9; color: #2563a9; background: #eef5fc; font-weight: 700; }
.grade-options button:focus-visible { outline: 2px solid #b8d6ff; outline-offset: 1px; }
.relation-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
.relation-option { position: relative; display: grid; min-height: 40px; border: 1px solid #d5deeb; border-radius: 9px; color: #64748b; font-size: 13px; place-items: center; cursor: pointer; }
.relation-option.selected { border-color: #2275e9; color: #2563a9; background: #f0f6ff; }
.relation-option input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.relation-option:focus-within { outline: 2px solid #b8d6ff; outline-offset: 2px; }
.consent { display: flex; align-items: flex-start; gap: 8px; color: #62718c; font-size: 12px; line-height: 1.7; }
.consent input { flex-shrink: 0; width: 18px; height: 18px; margin: 1px 0 0; accent-color: #2563a9; }
.submit-button { min-height: 48px; border: 0; border-radius: 12px; background: #2563a9; color: #fff; font-size: 17px; font-weight: 700; cursor: pointer; }
.form-fields:disabled { opacity: 0.65; }
.form-error { margin: 0; color: #c03333; font-size: 13px; line-height: 1.6; }
.form-footnote { margin: 14px 0 0; color: #8795ab; font-size: 12px; text-align: center; line-height: 1.7; }
</style>
