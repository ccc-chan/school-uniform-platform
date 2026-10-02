import { request } from '@/api/http'

import type { PageData } from '@/types/common'
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
  productImageId?: number | null
  companyId?: number | null
  companyName?: string
  sizes?: readonly string[]
  style?: string
  category?: string
  safetyCategory?: string
  executionStandard?: string
  fabricSummary?: string
  qrCodeType?: string
  qualityStatus?: string
  inspectionStatus?: string
  productionQuantity?: number
  batchCount?: number
  quantity?: number
  deliveryDate?: string
  batchNo?: string
  orderId?: number
  productionDate?: string
  fabricComponents?: readonly string[]
  fabricRatio?: string
  qualityReportFileId?: number | null
  qualityReportFileName?: string
  qualityReportFileSize?: number
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

export interface ProductionBatchCreate {
  quantity: number
  productionDate: string
  executionStandard: string
  safetyCategory: string
  fabricItems: Array<{
    component: string
    ratio: string
  }>
  qualityReport: File | null
}

export interface ProductionOrderFilters {
  keyword: string
  batchNo: string
  safetyCategory: string
  qrCodeType: string
  qualityReport: string
  status: string
}

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
  return request<PageData<ProductionItem>>(
    `/api/v1/production/${resource}?${queryString(params)}`,
  )
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

export function createProductionOrderBatch(
  orderId: number,
  data: ProductionBatchCreate,
) {
  const body = new FormData()
  const { qualityReport, ...payload } = data
  body.append('payload', JSON.stringify(payload))
  if (qualityReport) body.append('file', qualityReport)
  return request<ProductionItem>(
    `/api/v1/production/orders/${orderId}/batches`,
    { method: 'POST', body },
  )
}

export function createProductionProductBatch(
  productId: number,
  data: ProductionBatchCreate,
) {
  const body = new FormData()
  const { qualityReport, ...payload } = data
  body.append('payload', JSON.stringify(payload))
  if (qualityReport) body.append('file', qualityReport)
  return request<ProductionItem>(
    `/api/v1/production/products/${productId}/batches`,
    { method: 'POST', body },
  )
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

export function deleteProductionItem(
  resource: ProductionResource,
  id: number,
) {
  return request<null>(`/api/v1/production/${resource}/${id}`, {
    method: 'DELETE',
  })
}

export function getProductionOptions() {
  return request<ProductionOptions>('/api/v1/production/options')
}
