<!--
 * @Author: Chan
 * @Date: 2026-07-15 17:16:56
 * @LastEditors: chan
 * @LastEditTime: 2026-08-21 15:43:49
 * @FilePath: /school-uniform-platform/apps/admin-web/src/views/LoginView.vue
 * @Description: 
 * 
-->
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
  <main
    class="relative min-h-screen overflow-hidden bg-[#edf3ff] sm:px-6 sm:py-6 lg:px-8 lg:py-8"
  >
    <div
      class="pointer-events-none absolute left-[-10rem] top-[-12rem] h-100 w-100 rounded-full bg-blue-300/25 blur-3xl"
    />
    <div
      class="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-110 w-110 rounded-full bg-indigo-300/25 blur-3xl"
    />

    <div
      class="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 overflow-hidden bg-gradient-to-br from-[#0b2f5b] via-[#164da3] to-[#3978ef] sm:min-h-[calc(100vh-5rem)] sm:rounded-6 sm:shadow-[0_30px_80px_rgba(29,78,216,0.16)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-[1.15fr_0.85fr] lg:bg-white"
    >
      <header
        class="relative overflow-hidden px-7 pb-18 pt-[max(2.5rem,env(safe-area-inset-top))] text-white lg:hidden"
      >
        <div
          class="pointer-events-none absolute right-[-3rem] top-[-4rem] h-48 w-48 rounded-full border border-white/10 bg-white/8"
        />
        <div
          class="pointer-events-none absolute bottom-4 left-[-4rem] h-32 w-32 rounded-full bg-blue-300/15 blur-2xl"
        />

        <div class="relative flex items-center gap-3">
          <div
            class="h-11 w-11 flex items-center justify-center rounded-3 border border-white/25 bg-white/15 text-lg font-700 shadow-lg backdrop-blur"
          >
            校
          </div>
          <div>
            <div class="text-base font-700 tracking-wide">校服数字身份</div>
            <div class="mt-0.5 text-[10px] tracking-[0.16em] text-blue-100">
              SCHOOL UNIFORM DIGITAL IDENTITY
            </div>
          </div>
        </div>

        <div class="relative mt-8">
          <div class="text-7 font-700 leading-tight">一衣一码，品质可溯1</div>
          <p class="mb-0 mt-2 text-sm leading-6 text-blue-100">
            为每一件校服建立可信的数字身份证
          </p>
        </div>
      </header>

      <LoginBrandPanel class="hidden lg:block" />
      <LoginFormCard
        :loading="loading"
        :error="errorMessage"
        @submit="handleSubmit"
      />
    </div>

    <footer
      class="relative bg-white pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-center text-[11px] text-slate-400 sm:mt-4 sm:bg-transparent sm:pb-0 sm:pt-0 sm:text-xs"
    >
      Copyright © 2026 校服数字身份平台 All Rights Reserved.
    </footer>
  </main>
</template>
