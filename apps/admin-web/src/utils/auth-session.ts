import type { AuthSession } from '@/api/auth'

const AUTH_STORAGE_KEY = 'school-uniform-admin-session'

export function readAuthSession(): AuthSession | null {
  const value =
    localStorage.getItem(AUTH_STORAGE_KEY) ??
    sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!value) return null

  try {
    const session = JSON.parse(value) as AuthSession

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
  clearAuthSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
