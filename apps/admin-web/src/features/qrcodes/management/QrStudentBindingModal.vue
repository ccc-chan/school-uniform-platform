<script setup lang="ts">
import { reactive } from 'vue'
import message from 'ant-design-vue/es/message'
import type { QrManagementItem, QrStudentInput } from '@/api/qr-management'

const props = defineProps<{ item: QrManagementItem; saving: boolean }>()
const emit = defineEmits<{ save: [value: QrStudentInput]; close: [] }>()
// 弹窗按二维码重新挂载。手机号不回填脱敏字符串，留空表示保留原号码。
const form = reactive<QrStudentInput>({
  schoolName: props.item.schoolName || '', className: props.item.className || '',
  studentName: props.item.studentName || '', parentName: props.item.parentName || '',
  phone: '', version: props.item.version, parentAuthorized: false,
  studentGender: props.item.studentGender || '', grade: props.item.grade || '',
  studentNo: props.item.studentNo || '', parentRelation: props.item.parentRelation || '',
})
const fields = [
  { key: 'schoolName', label: '学校' }, { key: 'className', label: '班级' },
  { key: 'studentName', label: '学生姓名' }, { key: 'parentName', label: '家长姓名' },
] as const
function submit() {
  if (props.saving) return
  if (!form.parentAuthorized) return void message.warning('请确认已获得家长授权')
  const value = { ...form }
  for (const field of fields) {
    value[field.key] = value[field.key].trim()
    if (!value[field.key]) return void message.warning(`请填写${field.label}`)
  }
  value.phone = value.phone.trim()
  value.grade = value.grade.trim()
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
    :width="600"
    :cancel-button-props="{ disabled: saving }" @ok="submit" @cancel="emit('close')">
    <p class="binding-code">二维码ID：{{ item.code }}</p>
    <a-form layout="vertical" :disabled="saving" @submit.prevent="submit">
      <a-form-item v-for="field in fields" :key="field.key" :label="field.label" required>
        <a-input v-model:value="form[field.key]" :aria-label="field.label" :maxlength="100" :placeholder="`请输入${field.label}`" />
      </a-form-item>
      <div class="binding-extra">
        <a-form-item label="性别">
          <a-select v-model:value="form.studentGender" aria-label="性别" :options="[
            { label: '未填写', value: '' }, { label: '男', value: 'male' },
            { label: '女', value: 'female' }, { label: '未说明', value: 'unknown' },
          ]" />
        </a-form-item>
        <a-form-item label="年级"><a-input v-model:value="form.grade" aria-label="年级" placeholder="例如：一年级" :maxlength="100" /></a-form-item>
        <a-form-item label="学号"><a-input v-model:value="form.studentNo" aria-label="学号" placeholder="请输入学号" :maxlength="100" /></a-form-item>
        <a-form-item label="与学生关系"><a-input v-model:value="form.parentRelation" aria-label="与学生关系" placeholder="例如：母亲" :maxlength="50" /></a-form-item>
      </div>
      <a-form-item label="家长手机号" :required="!item.version"
        :help="item.version ? `当前号码：${item.phoneMasked || '—'}；留空保留原号码` : '用于家长联系方式，保存后脱敏展示'">
        <a-input v-model:value="form.phone" aria-label="家长手机号" inputmode="tel" autocomplete="off" :maxlength="11"
          :placeholder="item.version ? '输入新手机号，或留空保留' : '请输入11位手机号'" @press-enter="submit" />
      </a-form-item>
      <a-form-item>
        <a-checkbox v-model:checked="form.parentAuthorized" :disabled="saving">
          已获得家长授权
        </a-checkbox>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.binding-code { margin: 4px 0 20px; color: #64748b; overflow-wrap: anywhere; }
.binding-extra { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
@media (max-width: 480px) { .binding-extra { grid-template-columns: 1fr; } }
</style>
