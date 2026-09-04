/*
 * @Author: Chan
 * @Date: 2026-07-16 09:42:42
 * @LastEditors: chan
 * @LastEditTime: 2026-09-04 16:12:52
 * @FilePath: /school-uniform-platform/apps/admin-web/src/api/system.ts
 * @Description:
 *
 */
import { request, requestBlob } from '@/api/http'
import type {
  AccountStatus,
  Employee,
  EmployeeInput,
  ManagedFile,
  OperationLog,
  Role,
  RoleInput,
} from '@/types/system'
import type { PageData } from '@/types/common'

// 员工、角色、操作日志和系统文件管理接口。
function queryString(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()
}

export function getEmployees(params: Record<string, string | number>) {
  return request<PageData<Employee>>(
    `/api/v1/system/employees?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()}`,
  )
}

export function createEmployee(data: EmployeeInput) {
  return request<Employee>('/api/v1/system/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateEmployee(id: number, data: EmployeeInput) {
  return request<Employee>(`/api/v1/system/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function updateEmployeeStatus(id: number, status: AccountStatus) {
  return request<Employee>(`/api/v1/system/employees/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function resetEmployeePassword(id: number) {
  return request<{ temporaryPassword: string }>(
    `/api/v1/system/employees/${id}/reset-password`,
    { method: 'POST' },
  )
}

export function deleteEmployee(id: number) {
  return request<null>(`/api/v1/system/employees/${id}`, { method: 'DELETE' })
}

export function getRoles(keyword = '') {
  return request<Role[]>(
    `/api/v1/system/roles?keyword=${encodeURIComponent(keyword)}`,
  )
}

export function createRole(data: RoleInput) {
  return request<Role>('/api/v1/system/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRole(id: number, data: RoleInput) {
  return request<Role>(`/api/v1/system/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function updateRoleStatus(id: number, status: AccountStatus) {
  return request<Role>(`/api/v1/system/roles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteRole(id: number) {
  return request<null>(`/api/v1/system/roles/${id}`, { method: 'DELETE' })
}

export function getOperationLogs(params: Record<string, string | number>) {
  return request<PageData<OperationLog>>(
    `/api/v1/system/operation-logs?${queryString(params)}`,
  )
}
