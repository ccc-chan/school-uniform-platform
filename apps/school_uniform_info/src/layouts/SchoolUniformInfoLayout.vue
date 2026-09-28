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

</script>

<template>
  <main class="school-uniform-shell">
    <header
      class="app-bar"
      :class="{
        'app-bar--cover':
          viewModel.info.value &&
          !viewModel.loading.value &&
          !viewModel.errorMessage.value &&
          $route.name === 'school-uniform-info-home',
      }"
    >
      <span class="app-bar__mark">SU</span>
      <strong>校服数字档案</strong>
      <span class="app-bar__more">溯源查询</span>
    </header>

    <section
      v-if="viewModel.loading.value"
      class="state-panel"
      aria-live="polite"
    >
      <span class="state-panel__spinner" />
      <p>正在核验二维码信息…</p>
    </section>

    <section
      v-else-if="viewModel.errorMessage.value"
      class="state-panel state-panel--error"
      aria-live="assertive"
    >
      <span class="state-panel__error-icon">
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M6 18 18 6M6 6l12 12" />
        </svg>
      </span>
      <h1>二维码无效</h1>
      <p>{{ viewModel.errorMessage.value }}</p>
      <button type="button" @click="viewModel.retry">重新查询</button>
    </section>

    <template v-else-if="viewModel.info.value">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </template>
  </main>
</template>

<style scoped>
.school-uniform-shell {
  --archive-unit: min(calc(100vw / 853), calc(480px / 853));
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom);
  color: #0f172a;
  background: #fff;
  box-shadow: 0 20px 60px rgb(15 23 42 / 12%);
}

.app-bar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 56px;
  padding: 12px 20px;
  color: #64748b;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(10px);
}

.app-bar strong {
  color: var(--trace-primary);
  font-size: 15px;
  font-weight: 650;
}

.app-bar__mark {
  display: grid;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  color: #fff;
  background: var(--trace-primary);
  font-family: 'DIN Alternate', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 800;
  place-items: center;
}

.app-bar__more {
  justify-self: end;
  color: #64748b;
  font-size: 11px;
}

.app-bar--cover {
  display: none;
}

.app-bar--cover strong,
.app-bar--cover .app-bar__more {
  color: #fff;
}

.app-bar--cover .app-bar__mark {
  background: rgb(255 255 255 / 18%);
}

.state-panel {
  display: grid;
  min-height: 420px;
  padding: 64px 28px;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.state-panel__spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--trace-primary-border);
  border-top-color: var(--trace-primary);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.state-panel p {
  margin: 18px 0 0;
  color: #64748b;
  font-size: 14px;
}

.state-panel--error h1 {
  margin: 18px 0 0;
  font-size: 21px;
}

.state-panel__error-icon {
  display: grid;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  color: #dc2626;
  background: #fef2f2;
  place-items: center;
}

.state-panel__error-icon svg {
  width: 40px;
  height: 40px;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
}

.state-panel button {
  margin-top: 24px;
  padding: 11px 24px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: var(--trace-primary);
  font-size: 14px;
  font-weight: 650;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 520px) {
  .school-uniform-shell {
    min-height: calc(100vh - 32px);
    margin-top: 16px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 30px;
  }
}
</style>
