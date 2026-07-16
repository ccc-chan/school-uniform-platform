import { request } from '@/api/http'

export interface AuthProfile {
  id: number
  account: string
  name: string
  role: string
}

export interface AuthSession {
  token: string
  expiresAt: string
  profile: AuthProfile
}

export interface LoginPayload {
  account: string
  password: string
  captcha: string
}

export function loginApi(payload: LoginPayload) {
  return request<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logoutApi() {
  return request<null>('/api/v1/auth/logout', {
    method: 'POST',
  })
}
