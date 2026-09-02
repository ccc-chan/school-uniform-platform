import { request } from '@/api/http'

// 五类生产资源共享同一套列表、详情、创建、更新和状态接口。
export type ProductionResource =
  | 'orders'
  | 'batches'
  | 'processes'
  | 'records'
  | 'outbounds'

export interface ProductionItem {
  id: number
  status?: string
  createdAt?: string
  updatedAt?: string
  orderNo?: string
  customerName?: string
  productId?: number
  productCode?: string
  productName?: string
  quantity?: number
  deliveryDate?: string
  batchNo?: string
  orderId?: number
  productionDate?: string
  factoryName?: string
  responsibleEmployeeId?: number
  responsibleEmployeeName?: string
  flowName?: string
  nodeName?: string
  nodeOrder?: number
  description?: string
  consumerVisible?: boolean
  employeeId?: number
  employeeName?: string
  processId?: number
  processName?: string
  startedAt?: string
  completedAt?: string
  outboundNo?: string
  outboundDate?: string
  recipient?: string
  destination?: string
  handledBy?: number
  handlerName?: string
  notes?: string
}

export type ProductionInput = Record<string, unknown>

export interface ProductionOptions {
  products: Array<{ id: number; code: string; name: string }>
  employees: Array<{ id: number; name: string }>
  orders: Array<{
    id: number
    orderNo: string
    productId: number
    productName: string
    quantity: number
  }>
  batches: Array<{ id: number; batchNo: string; quantity: number }>
  processes: Array<{ id: number; name: string }>
}

export interface ProductionPage {
  items: ProductionItem[]
  total: number
  page: number
  pageSize: number
}

function queryString(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()
}

export function getProductionList(
  resource: ProductionResource,
  params: Record<string, string | number>,
) {
  return request<ProductionPage>(
    `/api/v1/production/${resource}?${queryString(params)}`,
  )
}

export function getProductionItem(
  resource: ProductionResource,
  id: number,
) {
  return request<ProductionItem>(`/api/v1/production/${resource}/${id}`)
}

export function createProductionItem(
  resource: ProductionResource,
  data: ProductionInput,
) {
  return request<ProductionItem>(`/api/v1/production/${resource}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateProductionItem(
  resource: ProductionResource,
  id: number,
  data: ProductionInput,
) {
  return request<ProductionItem>(`/api/v1/production/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function updateProductionStatus(
  resource: ProductionResource,
  id: number,
  status: string,
) {
  return request<ProductionItem>(
    `/api/v1/production/${resource}/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  )
}

export function getProductionOptions() {
  return request<ProductionOptions>('/api/v1/production/options')
}
