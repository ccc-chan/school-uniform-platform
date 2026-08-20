// 系统管理模块的员工、角色、日志、文件及分页数据契约。
export type AccountStatus = 'enabled' | 'disabled'

export interface Employee {
  id: number
  name: string
  phone: string
  account: string
  roleId: number
  roleName: string
  department: string
  status: AccountStatus
  createdAt: string
  lastLoginAt: string
}

export interface EmployeeInput {
  name: string
  phone: string
  account: string
  roleId: number
  department: string
  status: AccountStatus
}

export interface EmployeePage {
  items: Employee[]
  total: number
  page: number
  pageSize: number
}

export interface Role {
  id: number
  name: string
  code: string
  description: string
  dataScope: string
  menuPermissions: string[]
  operationPermissions: string[]
  employeeCount: number
  status: AccountStatus
  createdAt: string
}

export type RoleInput = Omit<Role, 'id' | 'employeeCount' | 'createdAt'>

export interface OperationLog {
  id: number
  operator: string
  module: string
  action: string
  targetType: string
  targetId: number | null
  detail: Record<string, unknown> | null
  ip: string
  createdAt: string
}

export interface ManagedFile {
  id: number
  name: string
  mimeType: string
  category: 'image' | 'report'
  size: number
  uploader: string
  createdAt: string
}

export interface ResourcePage<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
