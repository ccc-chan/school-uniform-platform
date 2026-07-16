import { loginApi, logoutApi } from '@/api/auth'
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
  return Boolean(readAuthSession())
}

export const useAuthStore = defineStore('auth', () => {
  const session = shallowRef(readAuthSession())
  const isAuthenticated = computed(() => Boolean(session.value))
  const profile = computed(() =>
    session.value?.profile ?? {
      id: 0,
      account: '',
      name: '未登录',
      role: '',
    },
  )

  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const authSession = await loginApi({
        account: credentials.account,
        password: credentials.password,
        captcha: credentials.captcha,
      })

      saveAuthSession(authSession, credentials.remember)
      session.value = authSession

      return {
        success: true,
        message: '登录成功',
      }
    } catch (error) {
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
      clearAuthSession()
      session.value = null
    }
  }

  return {
    isAuthenticated,
    profile,
    login,
    logout,
  }
})
