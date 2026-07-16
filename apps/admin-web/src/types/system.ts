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
