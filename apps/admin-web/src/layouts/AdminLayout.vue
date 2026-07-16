<script setup lang="ts">
import type { MenuProps } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { sidebarCollapsed } = storeToRefs(appStore)
const mobileMenuOpen = shallowRef(false)

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
  {
    key: 'system',
    label: '系统管理',
    icon: h('span', '⚙'),
    children: [
      { key: '/system/employees', label: '员工账号管理' },
      { key: '/system/roles', label: '角色权限管理' },
    ],
  },
]

async function handleMenuClick({ key }: { key: string | number }) {
  await router.push(String(key))
  mobileMenuOpen.value = false
}

function toggleNavigation() {
  if (window.matchMedia('(max-width: 767px)').matches) {
    mobileMenuOpen.value = !mobileMenuOpen.value
    return
  }

  appStore.toggleSidebar()
}

async function handleLogout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<template>
  <a-layout class="min-h-screen">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="fixed inset-0 z-40 border-0 bg-slate-950/45 md:hidden"
      aria-label="关闭导航菜单"
      @click="mobileMenuOpen = false"
    />

    <a-layout-sider
      v-model:collapsed="sidebarCollapsed"
      :width="232"
      :collapsed-width="72"
      :trigger="null"
      collapsible
      class="admin-sider fixed inset-y-0 left-0 z-50 bg-brand-navy transition-transform duration-200 md:relative md:z-auto"
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
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
        :default-open-keys="['system']"
        @click="handleMenuClick"
      />

      <div class="absolute bottom-5 left-0 w-full px-4">
        <button
          type="button"
          class="h-10 w-full flex items-center justify-center gap-2 rounded-2 border-0 bg-white/8 text-xs text-white/70 hover:bg-white/12 hover:text-white"
          @click="toggleNavigation"
        >
          <span>{{ sidebarCollapsed ? '»' : '«' }}</span>
          <span v-if="!sidebarCollapsed">收起菜单</span>
        </button>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="h-16 flex items-center justify-between border-b border-slate-100 bg-white px-3 leading-none sm:px-4 md:h-18 md:px-6">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="h-9 w-9 flex items-center justify-center rounded-2 border-0 bg-slate-50 text-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            @click="toggleNavigation"
          >
            ☰
          </button>
          <h1 class="m-0 text-base font-700 text-slate-900 sm:text-lg">
            {{ pageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div class="relative hidden text-xl text-slate-500 sm:block">
            ♢
            <span class="absolute right-[-5px] top-[-6px] h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">12</span>
          </div>
          <div class="hidden h-7 w-px bg-slate-100 sm:block" />
          <div class="flex items-center gap-3">
            <a-avatar class="bg-blue-600">张</a-avatar>
            <div class="hidden leading-tight sm:block">
              <div class="text-sm font-600 text-slate-800">
                {{ authStore.profile.name }}
              </div>
              <div class="mt-1 text-[11px] text-slate-400">
                {{ authStore.profile.role }}
              </div>
            </div>
          </div>
          <a-button class="hidden sm:inline-flex" type="text" size="small" @click="handleLogout">
            退出登录
          </a-button>
          <a-button class="sm:hidden" type="text" size="small" @click="handleLogout">
            退出
          </a-button>
        </div>
      </a-layout-header>

      <a-layout-content class="min-w-0 bg-brand-surface p-3 sm:p-4 md:p-5">
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
