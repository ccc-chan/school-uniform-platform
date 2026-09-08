<script setup lang="ts">
import { computed } from 'vue'
import {
  createSchoolUniformInfoViewModel,
  provideSchoolUniformInfoViewModel,
} from '@/features/useSchoolUniformInfoViewModel'

const props = defineProps<{
  code: string
}>()

const viewModel = createSchoolUniformInfoViewModel(() => props.code)
provideSchoolUniformInfoViewModel(viewModel)

const navigation = computed(() => [
  {
    label: viewModel.traceTypeLabel.value,
    name: 'school-uniform-info-home',
    icon: viewModel.qrCodeType.value,
  },
  {
    label: '防伪验证',
    name: 'school-uniform-info-verify',
    icon: 'verify',
  },
])
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
          viewModel.qrCodeType.value === 'product' &&
          $route.name === 'school-uniform-info-home',
      }"
    >
      <span class="app-bar__mark">SU</span>
      <strong>校服数字档案</strong>
      <span class="app-bar__more">溯源查询</span>
    </header>

    <section v-if="viewModel.loading.value" class="state-panel" aria-live="polite">
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

      <nav class="bottom-navigation safe-bottom" aria-label="校服信息导航">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="{ name: item.name, params: { code: viewModel.code.value } }"
          active-class=""
          exact-active-class="nav-active"
          class="bottom-navigation__item"
        >
          <svg v-if="item.icon === 'product'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <svg v-else-if="item.icon === 'batch'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m-6 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          </svg>
          <svg v-else-if="item.icon === 'school'" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m-1-14h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
          </svg>
          <svg v-else aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M12 3c-3 2-5 3-9 3v6c0 5 5 8 9 10 4-2 9-5 9-10V6c-4 0-6-1-9-3Z" />
            <path d="m8 12 3 3 5-5" />
          </svg>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </template>
  </main>
</template>

<style scoped>
.school-uniform-shell {
  --archive-unit: min(calc(100vw / 853), calc(480px / 853));
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding-bottom: calc(var(--archive-unit) * 150 + env(safe-area-inset-bottom));
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
  font-family: "DIN Alternate", ui-monospace, monospace;
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

.bottom-navigation {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 15;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 480px);
  margin: 0 auto;
  border-top: 1px solid #f1f5f9;
  background: rgb(255 255 255 / 96%);
  box-shadow: none;
  backdrop-filter: blur(14px);
}

.bottom-navigation__item {
  display: flex;
  min-height: calc(var(--archive-unit) * 150);
  margin: 0;
  border-radius: 14px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--archive-unit) * 10);
  color: #64748b;
  font-size: calc(var(--archive-unit) * 28);
  text-decoration: none;
}

.bottom-navigation__item.nav-active {
  background: transparent;
}

.bottom-navigation__item svg {
  width: calc(var(--archive-unit) * 52);
  height: calc(var(--archive-unit) * 52);
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 520px) {
  .school-uniform-shell {
    min-height: calc(100vh - 32px);
    margin-top: 16px;
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 30px;
  }
}
</style>
