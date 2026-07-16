<script setup lang="ts">
import type { LoginCredentials } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = shallowRef(false)
const errorMessage = shallowRef('')
const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string'
    ? route.query.redirect
    : '/dashboard',
)

async function handleSubmit(credentials: LoginCredentials) {
  loading.value = true
  errorMessage.value = ''

  const result = await authStore.login(credentials)
  loading.value = false

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  await router.replace(redirectTarget.value)
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[#eef4ff] px-8 py-8">
    <div class="pointer-events-none absolute left-[-10rem] top-[-12rem] h-100 w-100 rounded-full bg-blue-300/20 blur-3xl" />
    <div class="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-110 w-110 rounded-full bg-indigo-300/20 blur-3xl" />

    <div class="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-6 bg-white shadow-[0_30px_80px_rgba(29,78,216,0.14)]">
      <LoginBrandPanel />
      <LoginFormCard
        :loading="loading"
        :error="errorMessage"
        @submit="handleSubmit"
      />
    </div>

    <footer class="relative mt-4 text-center text-xs text-slate-400">
      Copyright © 2026 校服数字身份平台 All Rights Reserved.
    </footer>
  </main>
</template>
