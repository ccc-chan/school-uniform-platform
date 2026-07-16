import AdminLayout from '@/layouts/AdminLayout.vue'
import { hasAuthSession } from '@/stores/auth'

const LoginView = () => import('@/views/LoginView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const EmployeeAccountsView = () => import('@/views/system/EmployeeAccountsView.vue')
const RolePermissionsView = () => import('@/views/system/RolePermissionsView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      component: AdminLayout,
      redirect: '/dashboard',
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            title: '首页概览',
            requiresAuth: true,
          },
        },
        {
          path: 'system/employees',
          name: 'system-employees',
          component: EmployeeAccountsView,
          meta: { title: '员工账号管理', requiresAuth: true },
        },
        {
          path: 'system/roles',
          name: 'system-roles',
          component: RolePermissionsView,
          meta: { title: '角色权限管理', requiresAuth: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const authenticated = hasAuthSession()

  if (to.name === 'login' && authenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !authenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  return true
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '管理后台')} - 校服数字身份平台`
})

export default router
