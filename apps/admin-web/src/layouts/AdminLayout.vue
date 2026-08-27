<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { MenuProps } from 'ant-design-vue'
import type { AuthMenu } from '@/api/auth'

const ChangePasswordModal = defineAsyncComponent(
  () => import('@/components/layout/ChangePasswordModal.vue'),
)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = shallowRef(false)
const passwordModalOpen = shallowRef(false)
const passwordModalMounted = shallowRef(false)
const openKeys = shallowRef<string[]>([])

function openPasswordModal() {
  passwordModalMounted.value = true
  passwordModalOpen.value = true
}

interface BreadcrumbItem {
  title: string
  path?: string
}

const pageTitle = computed(() => String(route.meta.title ?? '管理后台'))
const parentTitle = computed(() => {
  const menuCode = String(route.meta.menuCode ?? '')
  return authStore.menus.find((menu) => menu.code === menuCode)?.name ?? ''
})
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  const routeItems = Array.isArray(route.meta.breadcrumb)
    ? route.meta.breadcrumb as BreadcrumbItem[]
    : []

  if (parentTitle.value && parentTitle.value !== pageTitle.value) {
    items.push({ title: parentTitle.value })
  }

  items.push(...routeItems)

  if (items.at(-1)?.title !== pageTitle.value) {
    items.push({ title: pageTitle.value })
  }

  return items
})
const avatarText = computed(
  () => authStore.profile.name.trim().slice(0, 1) || '用',
)

watch(
  () => route.path,
  (path) => {
    const parent = path.startsWith('/products')
      ? 'products'
      : path.startsWith('/qrcodes')
        ? 'qrcodes'
        : path.startsWith('/production')
          ? 'production'
          : path.startsWith('/quality')
            ? 'quality'
            : path.startsWith('/brand')
              ? 'brand'
              : path.startsWith('/analytics')
                ? 'analytics'
                : path.startsWith('/system')
                  ? 'shortcut_system'
                  : ''
    openKeys.value = parent ? [parent] : []
  },
  { immediate: true },
)

const rootSubmenuKeys = [
  'products',
  'qrcodes',
  'production',
  'quality',
  'brand',
  'analytics',
  'system',
  'shortcut_system',
]

const handleOpenChange: NonNullable<MenuProps['onOpenChange']> = (keys) => {
  const normalizedKeys = keys.map(String)
  const latestOpenKey = normalizedKeys.find(
    (key) => !openKeys.value.includes(key),
  )

  if (!latestOpenKey || !rootSubmenuKeys.includes(latestOpenKey)) {
    openKeys.value = normalizedKeys
    return
  }

  openKeys.value = [latestOpenKey]
}

const menuPresentation: Record<string, { icon: string; implemented: boolean }> =
  {
    dashboard: { icon: '⌂', implemented: true },
    products: { icon: '▣', implemented: true },
    qrcodes: { icon: '⌗', implemented: true },
    production: { icon: '◇', implemented: true },
    quality: { icon: '◉', implemented: true },
    brand: { icon: '♢', implemented: true },
    analytics: { icon: '▥', implemented: true },
    system: { icon: '⚙', implemented: true },
    shortcut_dashboard: { icon: '⌂', implemented: true },
    shortcut_products: { icon: '▣', implemented: true },
    shortcut_label_print: { icon: '⌗', implemented: true },
    shortcut_employees: { icon: '⚙', implemented: true },
    shortcut_company_settings: { icon: '♢', implemented: true },
    shortcut_system: { icon: '⚙', implemented: true },
  }

function buildLegacyMenuItem(menu: AuthMenu) {
  const presentation = menuPresentation[menu.code]

  if (menu.code === 'products') {
    return {
      key: 'products',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [{ key: '/products', label: '产品列表' }],
    }
  }

  if (menu.code === 'qrcodes') {
    return {
      key: 'qrcodes',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/qrcodes', label: '二维码首页' },
        { key: '/qrcodes/generate', label: '生成二维码' },
        { key: '/qrcodes/batch-generate', label: '批量生成二维码' },
        { key: '/qrcodes/bind', label: '二维码绑定' },
        { key: '/qrcodes/label-print', label: '标签打印' },
      ],
    }
  }

  if (menu.code === 'production') {
    return {
      key: 'production',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/production/orders', label: '生产订单' },
        { key: '/production/batches', label: '生产批次' },
        { key: '/production/processes', label: '生产流程' },
        { key: '/production/records', label: '生产记录' },
        { key: '/production/factories', label: '工厂管理' },
        { key: '/production/outbounds', label: '出厂管理' },
      ],
    }
  }

  if (menu.code === 'quality') {
    return {
      key: 'quality',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/quality/reports', label: '检测报告' },
        { key: '/quality/reports/upload', label: '上传检测报告' },
        { key: '/quality/items', label: '检测项目管理' },
        { key: '/quality/history', label: '检测历史记录' },
      ],
    }
  }

  if (menu.code === 'brand') {
    return {
      key: 'brand',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/brand/profile', label: '品牌资料管理' },
        { key: '/brand/stories', label: '品牌故事管理' },
        { key: '/brand/factories', label: '工厂展示管理' },
        { key: '/brand/videos', label: '视频资料管理' },
      ],
    }
  }

  if (menu.code === 'system') {
    return {
      key: 'system',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/system/employees', label: '员工账号管理' },
        { key: '/system/roles', label: '角色权限管理' },
        { key: '/system/operation-logs', label: '操作日志管理' },
        { key: '/system/files', label: '文件管理' },
      ],
    }
  }

  if (menu.code === 'analytics') {
    return {
      key: 'analytics',
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: [
        { key: '/analytics/scans', label: '扫码统计分析' },
        { key: '/analytics/products', label: '产品分析' },
        { key: '/analytics/regions', label: '区域分析' },
        { key: '/analytics/screen', label: '数据大屏' },
      ],
    }
  }

  return {
    key: menu.path || menu.code,
    label: menu.name,
    icon: h('span', presentation?.icon ?? '•'),
    disabled: !presentation?.implemented,
  }
}

const legacyGroup = computed(() =>
  authStore.menus.find((menu) => menu.code === 'legacy_group'),
)
const shortcutGroup = computed(() =>
  authStore.menus.find((menu) => menu.code === 'shortcut_group'),
)
const legacyMenus = computed(() =>
  authStore.menus
    .filter((menu) => menu.parentId === legacyGroup.value?.id)
    .sort((left, right) => left.sort - right.sort),
)
const shortcutMenus = computed(() =>
  authStore.menus
    .filter((menu) => menu.parentId === shortcutGroup.value?.id)
    .sort((left, right) => left.sort - right.sort),
)
const legacyMenuItems = computed(() =>
  legacyMenus.value.map(buildLegacyMenuItem),
)

const shortcutSystemMenuChildren = [
  {
    key: 'shortcut_system_employees',
    path: '/system/employees',
    label: '员工账号管理',
  },
  {
    key: 'shortcut_system_roles',
    path: '/system/roles',
    label: '角色权限管理',
  },
  {
    key: 'shortcut_system_operation_logs',
    path: '/system/operation-logs',
    label: '操作日志管理',
  },
]

function buildShortcutMenuItem(menu: AuthMenu) {
  const presentation = menuPresentation[menu.code]

  if (menu.code === 'shortcut_system') {
    return {
      key: menu.code,
      label: menu.name,
      icon: h('span', presentation?.icon ?? '•'),
      children: shortcutSystemMenuChildren.map(({ key, label }) => ({
        key,
        label,
      })),
    }
  }

  return {
    key: menu.code,
    label: menu.name,
    icon: h('span', presentation?.icon ?? '•'),
  }
}

const shortcutMenuItems = computed(() =>
  shortcutMenus.value.map(buildShortcutMenuItem),
)
const shortcutPathByKey = computed(() => {
  const paths = new Map<string, string>()

  for (const menu of shortcutMenus.value) {
    if (menu.path) paths.set(menu.code, menu.path)
  }

  for (const item of shortcutSystemMenuChildren) {
    paths.set(item.key, item.path)
  }

  return paths
})
const selectedKeys = computed(() => [
  route.path,
  ...shortcutMenus.value
    .filter((menu) => menu.path === route.path)
    .map((menu) => menu.code),
  ...shortcutSystemMenuChildren
    .filter((item) => item.path === route.path)
    .map((item) => item.key),
])
const menuItems = computed<MenuProps['items']>(() =>
  [
    legacyGroup.value && !shortcutGroup.value
      ? {
          type: 'group',
          key: legacyGroup.value.code,
          label: legacyGroup.value.name,
          children: legacyMenuItems.value,
        }
      : null,
    shortcutGroup.value
      ? {
          type: 'group',
          key: shortcutGroup.value.code,
          label: undefined,
          children: shortcutMenuItems.value,
        }
      : null,
  ].filter(Boolean) as unknown as NonNullable<MenuProps['items']>,
)

async function handleMenuClick({ key }: { key: string | number }) {
  const normalizedKey = String(key)
  const targetPath = shortcutPathByKey.value.get(normalizedKey) || normalizedKey
  await router.push(targetPath)
  mobileMenuOpen.value = false
}

function toggleNavigation() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

async function handleLogout() {
  await authStore.logout()
  await router.replace('/login')
}

</script>

<template>
  <a-layout class="h-screen overflow-hidden">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="fixed inset-0 z-40 border-0 bg-slate-950/45 md:hidden"
      aria-label="关闭导航菜单"
      @click="mobileMenuOpen = false"
    />

    <a-layout-sider
      :width="240"
      :trigger="null"
      class="admin-sider fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-200 md:relative md:z-auto"
      :class="
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      "
    >
      <div class="admin-brand">
        <div class="admin-brand-mark">校</div>
        <div class="min-w-0">
          <div class="admin-brand-name">校服溯源管理系统</div>
          <div class="admin-brand-caption">SCHOOL UNIFORM TRACE</div>
        </div>
      </div>

      <a-menu
        :open-keys="openKeys"
        class="admin-menu"
        theme="dark"
        mode="inline"
        :items="menuItems"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
        @open-change="handleOpenChange"
      />

      <div class="admin-account">
        <button
          type="button"
          class="admin-account-profile"
          title="修改密码"
          @click="openPasswordModal"
        >
          <a-avatar :size="34" class="admin-account-avatar">
            {{ avatarText }}
          </a-avatar>
          <span class="min-w-0 text-left">
            <span class="admin-account-name">
              {{ authStore.profile.name }}
            </span>
            <span class="admin-account-role">
              {{ authStore.profile.role }}
            </span>
          </span>
        </button>

        <button
          type="button"
          class="admin-account-logout"
          @click="handleLogout"
        >
          退出
        </button>
      </div>
    </a-layout-sider>

    <a-layout class="h-screen min-w-0 overflow-hidden">
      <a-layout-header class="admin-header">
        <div class="flex min-w-0 items-center">
          <button
            type="button"
            class="admin-mobile-trigger"
            aria-label="打开导航菜单"
            @click="toggleNavigation"
          >
            ☰
          </button>

          <nav class="admin-breadcrumb" aria-label="当前位置">
            <template
              v-for="(item, index) in breadcrumbItems"
              :key="`${item.title}-${index}`"
            >
              <RouterLink
                v-if="item.path"
                :to="item.path"
                class="admin-breadcrumb-item admin-breadcrumb-link"
              >
                {{ item.title }}
              </RouterLink>
              <span
                v-else
                class="admin-breadcrumb-item"
                :class="{ 'admin-breadcrumb-current': index === breadcrumbItems.length - 1 }"
              >
                {{ item.title }}
              </span>

              <span
                v-if="index < breadcrumbItems.length - 1"
                class="admin-breadcrumb-separator"
                aria-hidden="true"
              >
                ›
              </span>
            </template>
          </nav>
        </div>

        <div class="admin-header-actions">
          <span class="admin-page-chip">{{ pageTitle }}</span>
          <button
            type="button"
            class="admin-header-logout"
            @click="handleLogout"
          >
            退出登录
          </button>
        </div>
      </a-layout-header>

      <a-layout-content class="min-h-0 min-w-0 overflow-y-auto bg-[#f6f8fb] p-3 sm:p-4 md:p-6">
        <RouterView />
      </a-layout-content>
    </a-layout>

    <ChangePasswordModal
      v-if="passwordModalMounted"
      v-model:open="passwordModalOpen"
    />
  </a-layout>
</template>

<style scoped>
.admin-sider {
  position: relative;
  background: #101827 !important;
  border-right: 1px solid rgb(148 163 184 / 12%);
}

.admin-sider :deep(.ant-layout-sider-children) {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.admin-brand {
  display: flex;
  height: 77px;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgb(148 163 184 / 16%);
}

.admin-brand-mark {
  display: flex;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(145deg, #5b9cff, #2563eb);
  box-shadow: 0 8px 22px rgb(37 99 235 / 38%);
  font-size: 13px;
  font-weight: 700;
}

.admin-brand-name {
  overflow: hidden;
  color: #f8fafc;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-brand-caption {
  margin-top: 4px;
  color: #64748b;
  font-size: 8px;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.admin-menu {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  border-inline-end: 0 !important;
  background: transparent !important;
}

.admin-menu :deep(.ant-menu-item-group-title:empty) {
  display: none;
}

.admin-menu :deep(.ant-menu-item),
.admin-menu :deep(.ant-menu-submenu-title) {
  width: 100%;
  height: 40px;
  margin: 3px 0;
  border-radius: 10px;
  color: #94a3b8 !important;
  line-height: 40px;
}

.admin-menu :deep(.ant-menu-item:hover),
.admin-menu :deep(.ant-menu-submenu-title:hover) {
  color: #f8fafc !important;
  background: #182235 !important;
}

.admin-menu :deep(.ant-menu-item-selected) {
  color: #ffffff !important;
  background: #283348 !important;
  font-weight: 600;
}

.admin-menu :deep(.ant-menu-sub) {
  background: transparent !important;
}

.admin-menu :deep(.ant-menu-sub .ant-menu-item) {
  padding-left: 42px !important;
  font-size: 13px;
}

.admin-menu :deep(.ant-menu-item::after) {
  display: none;
}

.admin-account {
  display: flex;
  min-height: 64px;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid rgb(148 163 184 / 16%);
}

.admin-account-profile {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
}

.admin-account-avatar {
  flex-shrink: 0;
  background: #2f6fed;
}

.admin-account-name,
.admin-account-role {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-account-name {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 600;
}

.admin-account-role {
  margin-top: 3px;
  color: #64748b;
  font-size: 10px;
}

.admin-account-logout {
  flex-shrink: 0;
  padding: 5px;
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 11px;
}

.admin-account-logout:hover {
  color: #e2e8f0;
}

.admin-header {
  display: flex;
  height: 56px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  line-height: 1;
}

.admin-mobile-trigger {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border: 0;
  border-radius: 8px;
  color: #475569;
  background: #f1f5f9;
}

.admin-breadcrumb {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.admin-breadcrumb-item {
  flex-shrink: 0;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.admin-breadcrumb-link {
  text-decoration: none;
  transition: color 0.2s;
}

.admin-breadcrumb-link:hover {
  color: #2563eb;
}

.admin-breadcrumb-separator {
  flex-shrink: 0;
  color: #cbd5e1;
  font-size: 18px;
}

.admin-breadcrumb-current {
  overflow: hidden;
  color: #172033;
  font-weight: 700;
  text-overflow: ellipsis;
}

.admin-header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
}

.admin-page-chip {
  padding: 8px 12px;
  border-radius: 10px;
  color: #2563eb;
  background: #eff6ff;
  font-size: 12px;
  font-weight: 600;
}

.admin-header-logout {
  padding: 6px;
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 12px;
}

.admin-header-logout:hover {
  color: #1e293b;
}

@media (min-width: 768px) {
  .admin-mobile-trigger {
    display: none;
  }
}

@media (max-width: 639px) {
  .admin-header {
    padding: 0 12px;
  }

  .admin-breadcrumb-item:not(.admin-breadcrumb-current),
  .admin-breadcrumb-separator,
  .admin-page-chip {
    display: none;
  }
}
</style>
