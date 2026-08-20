import { request } from '@/api/http'

// 二维码概览、生成批次、批量生成和生产批次绑定接口。
export type QrStatus = 'unbound' | 'bound' | 'activated' | 'voided'

export interface QrMetrics {
  total: number
  bound: number
  unbound: number
  activated: number
  voided: number
}

export interface QrOverviewItem {
  productId: number
  productCode?: string
  productName?: string
  style?: string
  color?: string
  total: number
  bound?: number
  unbound?: number
  activated?: number
  voided?: number
}

export interface QrProductOption {
  id: number
  code: string
  name: string
  style: string
  color: string
  season: string
}

export interface QrGenerationInput {
  productId: number
  quantity: number
  prefix: string
  notes: string
}

export interface QrGenerationResult {
  id: number
  batchNo: string
  productName: string
  quantity: number
}

export interface QrBatchGenerationInput {
  productCode: string
  quantity: number
  prefix: string
  notes: string
}

export interface QrBatchOption {
  id: number
  batchNo: string
  quantity: number
  available: number
  prefix: string
  createdAt: string
  productId: number
  productCode: string
  productName: string
  style: string
}

export interface QrBindingInput {
  generationBatchId: number
  quantity: number
  productSku: string
  productionBatch: string
}

export interface QrBindingResult {
  batchNo: string
  quantity: number
  productionBatch: string
  productSku: string
  boundAt: string
}

export interface QrLabelBatch {
  batchNo: string
  productionDate: string | null
  productCode: string
  productName: string
  style: string
  fabricInfo: string
  labelCount: number
}

export interface QrLabelItem {
  id: number
  code: string
  productSku: string
  size: string
}

export interface QrLabelBatchPage {
  batch: QrLabelBatch
  items: QrLabelItem[]
  total: number
  page: number
  pageSize: number
}

export interface QrPublicTrace {
  code: string
  status: QrStatus
  productCode: string
  productName: string
  category: string
  season: string
  style: string
  color: string
  fabricInfo: string
  executionStandard: string
  productionBatch: string
  productSku: string
  recorded: boolean
  scannedAt: string
}

export interface QrOverviewFilters {
  keyword: string
  status: QrStatus | ''
}

function queryString(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()
}

export function getQrOverview(params: Record<string, string | number>) {
  return request<{
    metrics: QrMetrics
    items: QrOverviewItem[]
    total: number
    page: number
    pageSize: number
  }>(`/api/v1/qrcodes/overview?${queryString(params)}`)
}

export function getQrProducts() {
  return request<QrProductOption[]>('/api/v1/qrcodes/products')
}

export function getQrBatches() {
  return request<QrBatchOption[]>('/api/v1/qrcodes/batches')
}

export function getQrLabelBatches() {
  return request<QrLabelBatch[]>('/api/v1/qrcodes/label-print/batches')
}

export function getQrLabelBatch(
  batchNo: string,
  page = 1,
  pageSize = 500,
) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  return request<QrLabelBatchPage>(
    `/api/v1/qrcodes/label-print/batches/${encodeURIComponent(batchNo)}?${query}`,
  )
}

export function generateQrCodes(data: QrGenerationInput) {
  return request<QrGenerationResult>('/api/v1/qrcodes/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function batchGenerateQrCodes(items: QrBatchGenerationInput[]) {
  return request<QrGenerationResult[]>('/api/v1/qrcodes/batch-generate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export function bindQrCodes(data: QrBindingInput) {
  return request<QrBindingResult>('/api/v1/qrcodes/bind', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function recordPublicQrScan(code: string) {
  return request<QrPublicTrace>(
    `/api/v1/public/qrcodes/${encodeURIComponent(code)}/scan`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  )
}
