/*
 * @Author: Chan
 * @Date: 2026-07-16 08:59:25
 * @LastEditors: chan
 * @LastEditTime: 2026-09-04 15:53:36
 * @FilePath: /school-uniform-platform/apps/admin-web/src/api/auth.ts
 * @Description:
 *
 */
import { request } from '@/api/http'

// 登录、密码、菜单和操作权限接口及其数据契约。
export interface AuthProfile {
  id: number
  account: string
  name: string
  role: string
  roleCode: string
}

export interface AuthUser {
  id: number
  username: string
  name: string
  departmentName: string
  roleName: string
  status: string
  permissions: string[]
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

export interface CaptchaResult {
  code: string
}

export interface ResetPasswordPayload {
  account: string
  phone: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface AuthMenu {
  id: number
  name: string
  code: string
  path: string | null
  parentId: number | null
  sort: number
}

export function getCaptchaApi() {
  return request<CaptchaResult>('/api/v1/auth/captcha')
}

export function loginApi(payload: LoginPayload) {
  return request<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetPasswordApi(payload: ResetPasswordPayload) {
  return request<null>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function changePasswordApi(payload: ChangePasswordPayload) {
  return request<null>('/api/v1/auth/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getAuthMenusApi() {
  return request<AuthMenu[]>('/api/v1/auth/menus')
}

export function getAuthPermissionsApi() {
  return request<string[]>('/api/v1/auth/permissions')
}

export function logoutApi() {
  return request<null>('/api/v1/auth/logout', {
    method: 'POST',
  })
}
