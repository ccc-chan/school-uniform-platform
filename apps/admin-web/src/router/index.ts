import AdminLayout from '@/layouts/AdminLayout.vue'
import { hasAuthSession } from '@/stores/auth'
import { getDefaultRoute, syncDynamicRoutes } from './dynamic-routes'

// 登录页和无权限页按需加载，减少首屏资源体积。
const LoginView = () => import('@/views/LoginView.vue')
const ForbiddenView = () => import('@/views/ForbiddenView.vue')
const QrTraceView = () => import('@/views/public/QrTraceView.vue')

const router = createRouter({
  history: createWebHistory(),
  // 这里只声明公共路由和管理端外壳；业务路由会根据用户菜单动态注入。
  routes: [
    {
      path: '/trace/:code',
      name: 'qr-trace',
      component: QrTraceView,
      meta: {
        title: '校服数字身份',
        public: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: '登录',
        public: true,
      },
    },
    {
      path: '/',
      name: 'admin',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'no-access',
          name: 'no-access',
          component: ForbiddenView,
          meta: { title: '无访问权限', requiresAuth: true },
        },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: ForbiddenView,
          meta: { title: '无访问权限', requiresAuth: true },
        },
      ],
    },
  ],
})

// 每次导航都重新确认本地登录态、服务端菜单以及目标页面权限。
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const authenticated = hasAuthSession()

  // 登录态失效时移除旧动态路由，避免上一位用户的菜单残留。
  if (!authenticated) {
    syncDynamicRoutes(router, [])

    if (to.meta.requiresAuth) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    return true
  }

  // 公开追溯页不依赖管理端菜单，已登录用户访问时也直接放行。
  if (to.meta.public) return true

  // 菜单加载失败通常表示令牌过期，此时清理会话并重新登录。
  try {
    await authStore.loadMenus()
  } catch {
    await authStore.logout()
    return { name: 'login' }
  }

  // 根据服务端菜单同步业务路由，并记录路由表是否发生变化。
  const routesChanged = syncDynamicRoutes(router, authStore.menuCodes)

  // 已登录用户访问根路径或登录页时，跳转到其首个可访问模块。
  if (to.name === 'login' || to.path === '/') {
    return getDefaultRoute(authStore.menuCodes)
  }

  // 动态路由刚注入后重新匹配原地址，避免首次访问被兜底路由截获。
  if (routesChanged && to.name === 'not-found') {
    return { path: to.fullPath, replace: true }
  }

  // 菜单控制模块访问权，操作权限控制模块内的具体页面能力。
  const requiredMenu = String(to.meta.menuCode || '')
  if (requiredMenu && !authStore.hasMenu(requiredMenu)) {
    return { name: 'no-access' }
  }
  const requiredPermission = String(to.meta.requiredPermission || '')
  if (requiredPermission && !authStore.hasPermission(requiredPermission)) return { name: 'no-access' }

  return true
})

// 页面标题跟随当前路由更新，并保留统一的平台名称后缀。
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '管理后台')} - 校服数字身份平台`
})

export default router
