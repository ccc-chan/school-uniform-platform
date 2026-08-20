import { getAuthMenusApi, getAuthPermissionsApi, loginApi, logoutApi } from '@/api/auth'
import type { AuthMenu } from '@/api/auth'
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
} from '@/utils/auth-session'

export interface LoginCredentials {
  account: string
  password: string
  captcha: string
  remember: boolean
}

export interface LoginResult {
  success: boolean
  message: string
}

export function hasAuthSession() {
  // 路由守卫只关心是否存在仍在有效期内的本地会话。
  return Boolean(readAuthSession())
}

/**
 * 统一管理登录会话、用户资料、菜单和操作权限。
 */
export const useAuthStore = defineStore('auth', () => {
  const session = shallowRef(readAuthSession())
  const menus = shallowRef<AuthMenu[]>([])
  const menusLoaded = shallowRef(false)
  const permissions = shallowRef<string[]>([])
  const isAuthenticated = computed(() => Boolean(session.value))
  const menuCodes = computed(() => menus.value.map((item) => item.code))
  const profile = computed(() =>
    session.value?.profile ?? {
      id: 0,
      account: '',
      name: '未登录',
      role: '',
      roleCode: '',
    },
  )

  async function loadMenus(force = false) {
    // 菜单和权限属于同一授权快照，并行加载后再标记为已完成。
    if (menusLoaded.value && !force) return menus.value
    const [menuItems, permissionItems] = await Promise.all([getAuthMenusApi(), getAuthPermissionsApi()])
    menus.value = menuItems
    permissions.value = permissionItems
    menusLoaded.value = true
    return menus.value
  }

  function hasMenu(code: string) {
    return menuCodes.value.includes(code)
  }
  function genericPermissionCode(code: string) {
    if (code === 'view' || code.endsWith('.view') || code.includes('.field.')) {
      return 'view'
    }
    if (
      code === 'create' ||
      /\.(create|generate|batch_generate|bind)$/.test(code)
    ) {
      return 'create'
    }
    if (
      code === 'edit' ||
      /\.(edit|status|manage|approve|reject)$/.test(code)
    ) {
      return 'edit'
    }
    if (code === 'delete' || /\.(delete|void)$/.test(code)) {
      return 'delete'
    }
    if (code === 'export' || /\.(export|download)$/.test(code)) {
      return 'export'
    }
    return code
  }

  function hasPermission(code: string) {
    return permissions.value.includes(genericPermissionCode(code))
  }

  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const authSession = await loginApi({
        account: credentials.account,
        password: credentials.password,
        captcha: credentials.captcha,
      })

      // remember 决定写入 localStorage 还是当前标签会话存储。
      saveAuthSession(authSession, credentials.remember)
      session.value = authSession
      await loadMenus(true)

      return {
        success: true,
        message: '登录成功',
      }
    } catch (error) {
      clearAuthSession()
      session.value = null
      menus.value = []
      permissions.value = []
      menusLoaded.value = false
      return {
        success: false,
        message: error instanceof Error ? error.message : '登录失败，请稍后重试',
      }
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 服务端会话已失效时，仍需完成本地退出。
    } finally {
      // 无论服务端令牌是否仍有效，本地都必须清除完整授权状态。
      clearAuthSession()
      session.value = null
      menus.value = []
      permissions.value = []
      menusLoaded.value = false
    }
  }

  return {
    isAuthenticated,
    profile,
    menus,
    menuCodes,
    menusLoaded,
    loadMenus,
    hasMenu,
    permissions,
    hasPermission,
    login,
    logout,
  }
})
