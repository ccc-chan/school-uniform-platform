<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { sidebarCollapsed } = storeToRefs(appStore)

const selectedKeys = computed(() => [route.path])
const pageTitle = computed(() => String(route.meta.title ?? '管理后台'))

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', label: '首页概览', icon: h('span', '⌂') },
  { key: 'products', label: '产品中心', icon: h('span', '▣'), disabled: true },
  { key: 'qrcodes', label: '二维码中心', icon: h('span', '⌗'), disabled: true },
  { key: 'production', label: '生产中心', icon: h('span', '◇'), disabled: true },
  { key: 'quality', label: '检测中心', icon: h('span', '◉'), disabled: true },
  { key: 'brand', label: '品牌中心', icon: h('span', '♢'), disabled: true },
  { key: 'analytics', label: '数据统计', icon: h('span', '▥'), disabled: true },
  { key: 'system', label: '系统管理', icon: h('span', '⚙'), disabled: true },
]

async function handleMenuClick({ key }: { key: string | number }) {
  await router.push(String(key))
}

async function handleLogout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<template>
  <a-layout class="min-h-screen">
    <a-layout-sider
      v-model:collapsed="sidebarCollapsed"
      :width="232"
      :collapsed-width="72"
      :trigger="null"
      collapsible
      class="admin-sider bg-brand-navy"
    >
      <div class="h-18 flex items-center gap-3 overflow-hidden px-5 text-white">
        <div class="h-9 w-9 shrink-0 flex items-center justify-center rounded-2 border border-white/15 bg-white/12 font-700">
          校
        </div>
        <div v-if="!sidebarCollapsed" class="whitespace-nowrap">
          <div class="font-700">校服数字身份</div>
          <div class="mt-0.5 text-[10px] tracking-wide text-white/55">
            品牌与溯源管理系统
          </div>
        </div>
      </div>

      <a-menu
        class="admin-menu"
        theme="dark"
        mode="inline"
        :items="menuItems"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
      />

      <div class="absolute bottom-5 left-0 w-full px-4">
        <button
          type="button"
          class="h-10 w-full flex items-center justify-center gap-2 rounded-2 border-0 bg-white/8 text-xs text-white/70 hover:bg-white/12 hover:text-white"
          @click="appStore.toggleSidebar"
        >
          <span>{{ sidebarCollapsed ? '»' : '«' }}</span>
          <span v-if="!sidebarCollapsed">收起菜单</span>
        </button>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="h-18 flex items-center justify-between border-b border-slate-100 bg-white px-6 leading-none">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="h-9 w-9 flex items-center justify-center rounded-2 border-0 bg-slate-50 text-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            @click="appStore.toggleSidebar"
          >
            ☰
          </button>
          <h1 class="m-0 text-lg font-700 text-slate-900">
            {{ pageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-5">
          <div class="relative text-xl text-slate-500">
            ♢
            <span class="absolute right-[-5px] top-[-6px] h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">12</span>
          </div>
          <div class="h-7 w-px bg-slate-100" />
          <div class="flex items-center gap-3">
            <a-avatar class="bg-blue-600">张</a-avatar>
            <div class="leading-tight">
              <div class="text-sm font-600 text-slate-800">
                {{ authStore.profile.name }}
              </div>
              <div class="mt-1 text-[11px] text-slate-400">
                {{ authStore.profile.role }}
              </div>
            </div>
          </div>
          <a-button type="text" size="small" @click="handleLogout">
            退出登录
          </a-button>
        </div>
      </a-layout-header>

      <a-layout-content class="bg-brand-surface p-5">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-sider {
  position: relative;
  background: linear-gradient(180deg, #0b3972 0%, #082a55 100%) !important;
}

.admin-menu {
  border-inline-end: 0 !important;
  background: transparent !important;
}

.admin-menu :deep(.ant-menu-item) {
  margin-block: 5px;
  width: calc(100% - 16px);
  margin-inline: 8px;
}

.admin-menu :deep(.ant-menu-item-selected) {
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
}
</style>
