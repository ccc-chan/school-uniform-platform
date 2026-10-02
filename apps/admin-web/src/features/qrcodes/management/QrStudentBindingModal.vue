<script setup lang="ts">
import { reactive } from 'vue'
import message from 'ant-design-vue/es/message'
import type { QrManagementItem, QrStudentInput } from '@/api/qr-management'
import SchoolSelect from '@/components/common/SchoolSelect.vue'
import type { SchoolOption } from '@/api/schools'

const props = defineProps<{ item: QrManagementItem; saving: boolean }>()
const emit = defineEmits<{ save: [value: QrStudentInput]; close: [] }>()
// 弹窗按二维码重新挂载。手机号不回填脱敏字符串，留空表示保留原号码。
const form = reactive<QrStudentInput>({
  schoolId: props.item.schoolId || 0, className: props.item.className || '',
  studentName: props.item.studentName || '', parentName: props.item.parentName || '',
  phone: '', version: props.item.version, parentAuthorized: false,
  studentGender: props.item.studentGender || '', grade: props.item.grade || '',
  studentNo: props.item.studentNo || '', parentRelation: props.item.parentRelation || '',
})
const fields = [
  { key: 'studentName', label: '学生姓名' }, { key: 'parentName', label: '家长姓名' },
] as const
const gradeGroups = [
  { label: '幼儿园', values: ['小班', '中班', '大班'] },
  { label: '小学', values: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'] },
  { label: '初中', values: ['初一', '初二', '初三'] },
  { label: '高中', values: ['高一', '高二', '高三'] },
  { label: '中职', values: ['中职一年级', '中职二年级', '中职三年级'] },
  { label: '高等学校', values: ['大一', '大二', '大三', '大四', '大五', '研究生'] },
  { label: '特殊教育', values: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'] },
  { label: '专门学校', values: ['一年级', '二年级', '三年级'] },
] as const
const gradeOptions = gradeGroups.map((group) => ({
  label: group.label,
  options: group.values.map((value) => ({ label: value, value })),
}))
const classOptions = Array.from({ length: 30 }, (_, index) => ({
  label: `${index + 1}班`,
  value: `${index + 1}班`,
}))
const genderOptions = [
  { label: '未填写', value: '' },
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '未说明', value: 'unknown' },
]
const relationOptions = ['爸爸', '妈妈', '其他监护人'].map((value) => ({
  label: value,
  value,
}))
const initialSchools: SchoolOption[] = props.item.schoolId && props.item.schoolName
  ? [{ id: props.item.schoolId, name: props.item.schoolName, code: '', schoolType: '', address: '' }]
  : []
function submit() {
  if (props.saving) return
  if (!form.parentAuthorized) return void message.warning('请确认已获得家长授权')
  if (!form.schoolId) return void message.warning('请选择学校')
  if (!form.grade) return void message.warning('请选择年级')
  if (!form.className) return void message.warning('请选择班级')
  const value = { ...form }
  for (const field of fields) {
    value[field.key] = value[field.key].trim()
    if (!value[field.key]) return void message.warning(`请填写${field.label}`)
  }
  value.phone = value.phone.trim()
  value.grade = value.grade.trim()
  value.className = value.className.trim()
  value.studentNo = value.studentNo.trim()
  value.parentRelation = value.parentRelation.trim()
  if ((!value.version || value.phone) && !/^1[3-9]\d{9}$/.test(value.phone)) {
    return void message.warning('请输入有效的11位手机号')
  }
  emit('save', value)
}
</script>

<template>
  <a-modal :open="true" :title="item.version ? '编辑学生绑定' : '绑定学生'" ok-text="保存绑定" cancel-text="取消"
    :confirm-loading="saving" :closable="!saving" :mask-closable="false" :keyboard="!saving"
    :width="720"
    :cancel-button-props="{ disabled: saving }" @ok="submit" @cancel="emit('close')">
    <p class="binding-code">二维码ID：{{ item.code }}</p>
    <a-form layout="vertical" :disabled="saving" @submit.prevent="submit">
      <section class="binding-section">
        <header><strong>学生信息</strong><span>选择学校并填写学生学籍资料</span></header>
        <a-form-item label="学校" required class="binding-field--full">
          <SchoolSelect
            v-model="form.schoolId"
            :initial-options="initialSchools"
            :disabled="saving"
          />
        </a-form-item>
        <div class="binding-grid">
          <a-form-item label="年级" required>
            <a-select v-model:value="form.grade" :options="gradeOptions" placeholder="请选择年级" show-search />
          </a-form-item>
          <a-form-item label="班级" required>
            <a-select v-model:value="form.className" :options="classOptions" placeholder="请选择班级" show-search />
          </a-form-item>
          <a-form-item label="学生姓名" required>
            <a-input v-model:value="form.studentName" aria-label="学生姓名" :maxlength="100" placeholder="请输入学生姓名" />
          </a-form-item>
          <a-form-item label="性别">
            <a-select v-model:value="form.studentGender" aria-label="性别" :options="genderOptions" />
          </a-form-item>
          <a-form-item label="学号" class="binding-field--full">
            <a-input v-model:value="form.studentNo" aria-label="学号" placeholder="请输入学号" :maxlength="100" />
          </a-form-item>
        </div>
      </section>

      <section class="binding-section">
        <header><strong>监护人信息</strong><span>填写家长身份与联系方式</span></header>
        <div class="binding-grid">
          <a-form-item label="家长姓名" required>
            <a-input v-model:value="form.parentName" aria-label="家长姓名" :maxlength="100" placeholder="请输入家长姓名" />
          </a-form-item>
          <a-form-item label="与学生关系">
            <a-select v-model:value="form.parentRelation" :options="relationOptions" placeholder="请选择与学生关系" />
          </a-form-item>
          <a-form-item label="家长手机号" :required="!item.version" class="binding-field--full"
            :help="item.version ? `当前号码：${item.phoneMasked || '—'}；留空保留原号码` : '用于家长联系方式，保存后脱敏展示'">
            <a-input v-model:value="form.phone" aria-label="家长手机号" inputmode="tel" autocomplete="off" :maxlength="11"
              :placeholder="item.version ? '输入新手机号，或留空保留' : '请输入11位手机号'" @press-enter="submit" />
          </a-form-item>
        </div>
      </section>

      <section class="binding-consent">
        <a-checkbox v-model:checked="form.parentAuthorized" :disabled="saving">
          已获得家长授权
        </a-checkbox>
        <span>请确认家长已知悉并同意保存学生绑定信息</span>
      </section>
    </a-form>
  </a-modal>
</template>

<style scoped>
.binding-code {
  margin: 2px 0 18px;
  padding: 9px 12px;
  border-radius: 9px;
  color: #55708f;
  background: #f1f5fa;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.binding-section {
  padding: 18px 18px 2px;
  border: 1px solid #e4eaf2;
  border-radius: 13px;
  background: #fbfcfe;
}

.binding-section + .binding-section {
  margin-top: 14px;
}

.binding-section header {
  display: flex;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #2563eb;
  flex-direction: column;
  gap: 2px;
}

.binding-section header strong {
  color: #172033;
  font-size: 14px;
}

.binding-section header span {
  color: #8795a9;
  font-size: 12px;
}

.binding-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.binding-field--full {
  grid-column: 1 / -1;
}

.binding-consent {
  display: flex;
  margin-top: 14px;
  padding: 13px 16px;
  align-items: center;
  gap: 10px;
  border: 1px solid #dbe7f7;
  border-radius: 11px;
  background: #f4f8ff;
}

.binding-consent > span {
  color: #718096;
  font-size: 12px;
}

@media (max-width: 639px) {
  .binding-grid {
    grid-template-columns: 1fr;
  }

  .binding-field--full {
    grid-column: auto;
  }
}
</style>
