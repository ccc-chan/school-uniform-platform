<script setup lang="ts">
import { message } from 'ant-design-vue'
import { changePasswordApi } from '@/api/auth'
import type { ConfigFormField } from '@/components/common/types'

const open = defineModel<boolean>('open', { required: true })

const loading = shallowRef(false)
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: value => Object.assign(form, value),
})
const fields: ConfigFormField[] = [
  {
    key: 'currentPassword',
    label: '原密码',
    type: 'password',
    required: true,
    placeholder: '请输入原密码',
  },
  {
    key: 'newPassword',
    label: '新密码',
    type: 'password',
    required: true,
    placeholder: '请输入不少于 6 位的新密码',
  },
  {
    key: 'confirmPassword',
    label: '确认新密码',
    type: 'password',
    required: true,
    placeholder: '请再次输入新密码',
  },
]

watch(open, value => {
  if (value) {
    Object.assign(form, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }
})

async function submit() {
  if (!form.currentPassword) {
    message.warning('请输入原密码')
    return
  }

  if (form.newPassword.length < 6) {
    message.warning('新密码不能少于 6 位')
    return
  }

  if (form.currentPassword === form.newPassword) {
    message.warning('新密码不能与原密码相同')
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    message.warning('两次输入的新密码不一致')
    return
  }

  loading.value = true
  try {
    await changePasswordApi({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    message.success('密码修改成功')
    open.value = false
  } catch (error) {
    message.error(error instanceof Error ? error.message : '密码修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a-modal
    v-model:open="open"
    title="修改密码"
    :width="480"
    :confirm-loading="loading"
    wrap-class-name="responsive-modal"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" />
  </a-modal>
</template>
