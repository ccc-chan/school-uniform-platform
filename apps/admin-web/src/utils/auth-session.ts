import type { AuthSession } from '@/api/auth'

// localStorage 用于“记住登录”，sessionStorage 用于当前浏览器会话。
const AUTH_STORAGE_KEY = 'school-uniform-admin-session'

export function readAuthSession(): AuthSession | null {
  // 持久会话优先；saveAuthSession 会确保同一时间只写入一种存储。
  const value =
    localStorage.getItem(AUTH_STORAGE_KEY) ??
    sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!value) return null

  try {
    const session = JSON.parse(value) as AuthSession

    // 缺少令牌或客户端判断已过期时，立即删除损坏或失效的数据。
    if (!session.token || new Date(session.expiresAt).getTime() <= Date.now()) {
      clearAuthSession()
      return null
    }

    return session
  } catch {
    clearAuthSession()
    return null
  }
}

export function saveAuthSession(session: AuthSession, remember: boolean) {
  // 先清除两处旧数据，防止读取时命中历史会话。
  clearAuthSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  // 退出登录不依赖用户此前选择的存储类型，因此两处都清理。
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
