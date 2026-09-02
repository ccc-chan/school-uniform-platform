<script setup lang="ts">
import {
  createSchoolUniformInfoViewModel,
  provideSchoolUniformInfoViewModel,
} from '@/features/useSchoolUniformInfoViewModel'

const props = defineProps<{
  code: string
}>()

const viewModel = createSchoolUniformInfoViewModel(() => props.code)
provideSchoolUniformInfoViewModel(viewModel)

const navigation = [
  { label: '身份', name: 'school-uniform-info-home' },
  { label: '产品', name: 'school-uniform-info-product' },
  { label: '生产', name: 'school-uniform-info-production' },
  { label: '质检', name: 'school-uniform-info-quality' },
]
</script>

<template>
  <main
    class="school-uniform-shell mx-auto min-h-screen max-w-120 bg-cloth text-ink shadow-xl"
  >
    <header class="identity-ticket bg-ink px-6 pb-7 pt-8 text-white">
      <p class="m-0 text-2.5 font-600 tracking-[0.24em] text-white/58">
        SCHOOL UNIFORM
      </p>

      <div class="mt-5 flex items-end justify-between gap-5">
        <div>
          <h1 class="m-0 font-serif text-7 font-700 leading-tight">
            校服数字身份
          </h1>
          <p class="mb-0 mt-2 text-3.25 text-white/66">
            一物一码 · 信息可核验
          </p>
        </div>

        <span
          class="shrink-0 rounded-full border border-white/35 px-3 py-1 text-2.5 tracking-wider"
        >
          DIGITAL ID
        </span>
      </div>
    </header>

    <section v-if="viewModel.loading.value" class="px-5 py-16 text-center">
      <div
        class="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-ink/15 border-t-thread"
      />
      <p class="mb-0 mt-5 text-3.5 text-muted">正在核验二维码信息…</p>
    </section>

    <section
      v-else-if="viewModel.errorMessage.value"
      class="mx-5 mt-6 rounded-4 border border-thread/20 bg-white p-6"
    >
      <p class="m-0 text-4 font-700">暂时无法显示校服信息</p>
      <p class="mb-0 mt-3 text-3.5 leading-6 text-muted">
        {{ viewModel.errorMessage.value }}
      </p>
      <button
        class="mt-6 w-full rounded-3 border-0 bg-ink px-4 py-3 text-white"
        type="button"
        @click="viewModel.retry"
      >
        重新查询
      </button>
    </section>

    <template v-else-if="viewModel.info.value">
      <Transition name="page" mode="out-in">
        <RouterView />
      </Transition>

      <nav
        class="bottom-navigation safe-bottom grid grid-cols-4 border-t border-ink/8 bg-white/96 px-3 pt-3 backdrop-blur"
        aria-label="校服信息导航"
      >
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="{ name: item.name, params: { code: viewModel.code.value } }"
          active-class=""
          exact-active-class="nav-active"
          class="flex min-h-12 flex-col items-center justify-center text-3 text-muted no-underline"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </template>
  </main>
</template>

<style scoped>
.school-uniform-shell {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.bottom-navigation {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  max-width: 30rem;
  margin: 0 auto;
}
</style>
