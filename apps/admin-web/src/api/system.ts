import { request } from '@/api/http'
import type { AccountStatus, Employee, EmployeeInput, EmployeePage, Role, RoleInput } from '@/types/system'

export function getEmployees(params: Record<string, string | number>) {
  return request<EmployeePage>(`/api/v1/system/employees?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()}`)
}

export function createEmployee(data: EmployeeInput) {
  return request<Employee>('/api/v1/system/employees', { method: 'POST', body: JSON.stringify(data) })
}

export function updateEmployee(id: number, data: EmployeeInput) {
  return request<Employee>(`/api/v1/system/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateEmployeeStatus(id: number, status: AccountStatus) {
  return request<Employee>(`/api/v1/system/employees/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function resetEmployeePassword(id: number) {
  return request<{ temporaryPassword: string }>(`/api/v1/system/employees/${id}/reset-password`, { method: 'POST' })
}

export function getRoles(keyword = '') {
  return request<Role[]>(`/api/v1/system/roles?keyword=${encodeURIComponent(keyword)}`)
}

export function createRole(data: RoleInput) {
  return request<Role>('/api/v1/system/roles', { method: 'POST', body: JSON.stringify(data) })
}

export function updateRole(id: number, data: RoleInput) {
  return request<Role>(`/api/v1/system/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateRoleStatus(id: number, status: AccountStatus) {
  return request<Role>(`/api/v1/system/roles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}
