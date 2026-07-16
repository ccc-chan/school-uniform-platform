<script setup lang="ts">
import type { LoginCredentials } from '@/stores/auth'

const props = defineProps<{
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [credentials: LoginCredentials]
}>()

const form = reactive<LoginCredentials>({
  account: '',
  password: '',
  captcha: '',
  remember: true,
})
const localError = shallowRef('')
const visibleError = computed(() => localError.value || props.error)

function clearLocalError() {
  localError.value = ''
}

function handleSubmit() {
  clearLocalError()

  if (!form.account.trim()) {
    localError.value = '请输入登录账号'
    return
  }

  if (!form.password) {
    localError.value = '请输入登录密码'
    return
  }

  if (!form.captcha.trim()) {
    localError.value = '请输入验证码'
    return
  }

  emit('submit', {
    account: form.account.trim(),
    password: form.password,
    captcha: form.captcha.trim(),
    remember: form.remember,
  })
}
</script>

<template>
  <section class="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-14">
    <div class="w-full max-w-100">
      <div class="mb-6 sm:mb-8">
        <div class="mb-5 h-12 w-12 flex items-center justify-center rounded-3 bg-blue-600 text-xl font-700 text-white shadow-lg shadow-blue-200">
          校
        </div>
        <h1 class="m-0 text-6 font-700 tracking-tight text-slate-900 sm:text-7">
          欢迎登录
        </h1>
        <p class="mb-0 mt-2 text-sm text-slate-500">
          登录校服数字身份与品牌溯源平台
        </p>
      </div>

      <a-alert
        v-if="visibleError"
        class="mb-5"
        type="error"
        show-icon
        :message="visibleError"
      />

      <a-form :model="form" layout="vertical" @finish="handleSubmit">
        <a-form-item label="账号" name="account">
          <a-input
            v-model:value="form.account"
            size="large"
            autocomplete="username"
            placeholder="请输入登录账号"
            @change="clearLocalError"
          />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password
            v-model:value="form.password"
            size="large"
            autocomplete="current-password"
            placeholder="请输入登录密码"
            @change="clearLocalError"
          />
        </a-form-item>

        <a-form-item label="验证码" name="captcha">
          <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-2 sm:grid-cols-[minmax(0,1fr)_112px] sm:gap-3">
            <a-input
              v-model:value="form.captcha"
              size="large"
              :maxlength="4"
              placeholder="请输入验证码"
              @change="clearLocalError"
            />
            <div class="h-10 flex select-none items-center justify-center rounded-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-lg font-700 tracking-[0.22em] text-blue-700">
              7K9P
            </div>
          </div>
        </a-form-item>

        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a-checkbox v-model:checked="form.remember">
            记住登录状态
          </a-checkbox>
          <button
            class="border-0 bg-transparent p-0 text-sm text-blue-600 hover:text-blue-700"
            type="button"
          >
            忘记密码？
          </button>
        </div>

        <a-button
          block
          html-type="submit"
          size="large"
          type="primary"
          :loading="loading"
        >
          登录
        </a-button>
      </a-form>

      <div class="mt-6 rounded-3 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
        演示账号：<strong class="text-slate-700">admin</strong>
        <span class="mx-2 text-slate-300">|</span>
        密码：<strong class="text-slate-700">admin123</strong>
      </div>
    </div>
  </section>
</template>
