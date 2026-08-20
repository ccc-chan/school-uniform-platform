<script setup lang="ts">
import { getCaptchaApi, resetPasswordApi } from '@/api/auth'
import type { ConfigFormField } from '@/components/common/types'
import type { LoginCredentials } from '@/stores/auth'

const props = defineProps<{
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [credentials: LoginCredentials]
}>()

const mode = shallowRef<'login' | 'forgot-password'>('login')
const form = reactive<LoginCredentials>({
  account: '',
  password: '',
  captcha: '',
  remember: true,
})
const resetForm = reactive({
  account: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const localError = shallowRef('')
const resetSuccess = shallowRef('')
const resetLoading = shallowRef(false)
const captchaCode = shallowRef('')
const captchaLoading = shallowRef(false)
const visibleError = computed(() =>
  localError.value || (mode.value === 'login' ? props.error : ''),
)

async function refreshCaptcha() {
  if (captchaLoading.value) return

  captchaLoading.value = true
  form.captcha = ''

  try {
    const result = await getCaptchaApi()
    captchaCode.value = result.code
  } catch {
    localError.value = '验证码加载失败，请点击重试'
  } finally {
    captchaLoading.value = false
  }
}

function clearLocalError() {
  localError.value = ''
}

function switchMode(nextMode: 'login' | 'forgot-password') {
  mode.value = nextMode
  localError.value = ''
  resetSuccess.value = ''
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

async function handleResetPassword() {
  clearLocalError()
  resetSuccess.value = ''

  if (!resetForm.account.trim()) {
    localError.value = '请输入登录账号'
    return
  }

  if (!/^1\d{10}$/.test(resetForm.phone.trim())) {
    localError.value = '请输入正确的手机号'
    return
  }

  if (resetForm.password.length < 6) {
    localError.value = '新密码不能少于 6 位'
    return
  }

  if (resetForm.password !== resetForm.confirmPassword) {
    localError.value = '两次输入的密码不一致'
    return
  }

  resetLoading.value = true

  try {
    await resetPasswordApi({
      account: resetForm.account.trim(),
      phone: resetForm.phone.trim(),
      password: resetForm.password,
    })
    form.account = resetForm.account.trim()
    Object.assign(resetForm, {
      account: '',
      phone: '',
      password: '',
      confirmPassword: '',
    })
    mode.value = 'login'
    resetSuccess.value = '密码重置成功，请使用新密码登录'
    await refreshCaptcha()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '密码重置失败'
  } finally {
    resetLoading.value = false
  }
}

watch(
  () => props.error,
  (error) => {
    if (error) refreshCaptcha()
  },
)

onMounted(refreshCaptcha)

const loginFormModel = computed<Record<string, unknown>>({
  get: () => form,
  set: value => Object.assign(form, value),
})
const resetFormModel = computed<Record<string, unknown>>({
  get: () => resetForm,
  set: value => Object.assign(resetForm, value),
})
const loginFields: ConfigFormField[] = [
  {
    key: 'account',
    label: '账号',
    type: 'input',
    placeholder: '请输入登录账号',
    componentProps: { class: 'login-input', size: 'large', autocomplete: 'username', onChange: clearLocalError },
  },
  {
    key: 'password',
    label: '密码',
    type: 'password',
    placeholder: '请输入登录密码',
    componentProps: { class: 'login-input', size: 'large', autocomplete: 'current-password', onChange: clearLocalError },
  },
  { key: 'captcha', label: '验证码', type: 'input' },
]
const resetFields: ConfigFormField[] = [
  {
    key: 'account',
    label: '登录账号',
    type: 'input',
    placeholder: '请输入登录账号',
    componentProps: { class: 'login-input', size: 'large', autocomplete: 'username', onChange: clearLocalError },
  },
  {
    key: 'phone',
    label: '绑定手机号',
    type: 'input',
    placeholder: '请输入绑定手机号',
    componentProps: { class: 'login-input', size: 'large', maxlength: 11, autocomplete: 'tel', onChange: clearLocalError },
  },
  {
    key: 'password',
    label: '新密码',
    type: 'password',
    placeholder: '请输入新密码',
    componentProps: { class: 'login-input', size: 'large', autocomplete: 'new-password', onChange: clearLocalError },
  },
  {
    key: 'confirmPassword',
    label: '确认新密码',
    type: 'password',
    placeholder: '请再次输入新密码',
    componentProps: { class: 'login-input', size: 'large', autocomplete: 'new-password', onChange: clearLocalError },
  },
]
</script>

<template>
  <section class="relative z-1 -mt-8 flex items-center justify-center rounded-t-[2rem] bg-white px-5 pb-8 pt-8 shadow-[0_-16px_40px_rgba(7,30,71,0.12)] sm:mt-0 sm:rounded-none sm:px-10 sm:py-10 sm:shadow-none lg:px-14">
    <div class="w-full max-w-100">
      <div class="mb-6 sm:mb-8">
        <div class="mb-5 hidden h-12 w-12 items-center justify-center rounded-3 bg-blue-600 text-xl font-700 text-white shadow-lg shadow-blue-200 lg:flex">
          校
        </div>
        <div class="mb-2 flex items-center gap-2 lg:hidden">
          <span class="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <span class="text-xs font-600 tracking-[0.12em] text-blue-600">
            ACCOUNT LOGIN
          </span>
        </div>
        <h1 class="m-0 text-6 font-700 tracking-tight text-slate-900 sm:text-7">
          {{ mode === 'login' ? '欢迎登录' : '重置密码' }}
        </h1>
        <p class="mb-0 mt-2 text-sm leading-6 text-slate-500">
          {{ mode === 'login'
            ? '登录校服数字身份与品牌溯源平台'
            : '验证账号与手机号后设置新密码' }}
        </p>
      </div>

      <a-alert
        v-if="resetSuccess"
        class="mb-5"
        type="success"
        show-icon
        :message="resetSuccess"
      />

      <a-alert
        v-if="visibleError"
        class="mb-5"
        type="error"
        show-icon
        :message="visibleError"
      />

      <ConfigForm v-if="mode === 'login'" v-model="loginFormModel" class="login-form" :fields="loginFields" :model="form" @finish="handleSubmit">
        <template #field-captcha>
          <div class="grid grid-cols-[minmax(0,1fr)_96px] gap-2 sm:grid-cols-[minmax(0,1fr)_112px] sm:gap-3">
            <a-input
              v-model:value="form.captcha"
              class="login-input"
              size="large"
              :maxlength="4"
              placeholder="请输入验证码"
              @change="clearLocalError"
            />
            <button
              class="captcha-button h-11 flex select-none items-center justify-center rounded-3 border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100/70 text-lg font-700 tracking-[0.22em] text-blue-700 shadow-inner"
              type="button"
              :disabled="captchaLoading"
              aria-label="点击刷新验证码"
              title="点击刷新验证码"
              @click="refreshCaptcha"
            >
              {{ captchaLoading ? '····' : captchaCode }}
            </button>
          </div>
        </template>

        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a-checkbox v-model:checked="form.remember">
            记住登录状态
          </a-checkbox>
          <button
            class="border-0 bg-transparent p-0 text-sm text-blue-600 hover:text-blue-700"
            type="button"
            @click="switchMode('forgot-password')"
          >
            忘记密码？
          </button>
        </div>

        <a-button
          class="login-button"
          block
          html-type="submit"
          size="large"
          type="primary"
          :loading="loading"
        >
          登录
        </a-button>
      </ConfigForm>

      <ConfigForm v-else v-model="resetFormModel" class="login-form" :fields="resetFields" :model="resetForm" @finish="handleResetPassword">
        <a-button
          class="login-button"
          block
          html-type="submit"
          size="large"
          type="primary"
          :loading="resetLoading"
        >
          重置密码
        </a-button>

        <button
          class="mt-5 w-full border-0 bg-transparent p-0 text-sm text-blue-600 hover:text-blue-700"
          type="button"
          @click="switchMode('login')"
        >
          返回登录
        </button>
      </ConfigForm>

      <div v-if="mode === 'login'" class="mt-6 flex items-center gap-3 rounded-3 border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs leading-6 text-slate-500">
        <div class="h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-blue-500 text-[10px] font-700 text-white">
          i
        </div>
        <div>
          演示账号：<strong class="text-slate-700">admin</strong>
          <span class="mx-2 text-slate-300">|</span>
          密码：<strong class="text-slate-700">admin123</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-form :deep(.ant-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.ant-form-item-label > label) {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

:deep(.login-input) {
  border-color: transparent;
  border-radius: 12px;
  background: #f6f8fc;
  box-shadow: inset 0 0 0 1px #e7ebf2;
}

:deep(.login-input .ant-input) {
  background: transparent;
}

:deep(.login-input:hover) {
  border-color: #93b4f8;
  background: #ffffff;
}

:deep(.login-input.ant-input-affix-wrapper-focused),
:deep(.login-input:focus) {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.login-button {
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(100deg, #2563eb, #3978ef);
  font-weight: 600;
  letter-spacing: 0.18em;
  box-shadow: 0 10px 24px rgb(37 99 235 / 24%);
}

.captcha-button {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.captcha-button:hover:not(:disabled) {
  border-color: #93b4f8;
  transform: translateY(-1px);
}

.captcha-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.login-button:hover {
  background: linear-gradient(100deg, #1d4ed8, #2563eb) !important;
  transform: translateY(-1px);
}

@media (min-width: 640px) {
  :deep(.login-input),
  .login-button {
    border-radius: 10px;
  }
}
</style>
