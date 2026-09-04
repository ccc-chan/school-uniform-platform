import { request, requestBlob } from '@/api/http'
import type { PageData } from '@/types/common'

// 质量报告、检测项目、审核、附件下载和操作历史接口。
export type QualityReportStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
export type QualityConclusion = 'qualified' | 'unqualified'

export type QuickQualityReportType = 'certificate' | 'fabric' | 'quality'

export interface QualityResultItem {
  itemId: number
  code: string
  name: string
  category: string
  standardRequirement: string
  unit: string
  resultValue: string
  conclusion: QualityConclusion
  remark: string
}

export interface QualityResultInput {
  itemId: number
  resultValue: string
  conclusion: QualityConclusion
  remark: string
}

export interface QualityReport {
  id: number
  reportNo: string
  name: string
  productId?: number
  productCode?: string
  productName?: string
  institution?: string
  inspectionNo: string
  inspectionDate?: string
  validUntil?: string
  conclusion?: QualityConclusion
  status?: QualityReportStatus
  resultItems?: readonly QualityResultItem[]
  remarks: string
  fileId: number
  fileName: string
  fileSize: number
  submitterName: string
  reviewerName: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface QualityInspectionItem {
  id: number
  code: string
  name: string
  category: string
  standardRequirement: string
  unit: string
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface QualityOptions {
  products: Array<{ id: number; code: string; name: string }>
  items: QualityInspectionItem[]
}

export interface QualityReportCreate {
  name: string
  productId: number
  institution: string
  inspectionNo: string
  inspectionDate: string
  validUntil: string
  remarks: string
  resultItems: QualityResultInput[]
  file: File
}

export interface QuickQualityReportCreate {
  productId: number
  batchNo: string
  reportType: QuickQualityReportType
  conclusion: QualityConclusion
  remarks: string
  file: File
}

function queryString(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()
}

export function getQualityOptions() {
  return request<QualityOptions>('/api/v1/quality/options')
}

export function getQualityReports(params: Record<string, string | number>) {
  return request<PageData<QualityReport>>(
    `/api/v1/quality/reports?${queryString(params)}`,
  )
}

export function createQualityReport(data: QualityReportCreate) {
  // 报告字段、检测结果 JSON 和 PDF 附件通过 multipart 一次提交。
  const body = new FormData()
  body.append('name', data.name)
  body.append('productId', String(data.productId))
  body.append('institution', data.institution)
  body.append('inspectionNo', data.inspectionNo)
  body.append('inspectionDate', data.inspectionDate)
  body.append('validUntil', data.validUntil)
  body.append('remarks', data.remarks)
  body.append('resultItems', JSON.stringify(data.resultItems))
  body.append('file', data.file)
  return request<QualityReport>('/api/v1/quality/reports', {
    method: 'POST',
    body,
  })
}

export function createQuickQualityReport(data: QuickQualityReportCreate) {
  const body = new FormData()
  body.append('productId', String(data.productId))
  body.append('batchNo', data.batchNo)
  body.append('reportType', data.reportType)
  body.append('conclusion', data.conclusion)
  body.append('remarks', data.remarks)
  body.append('file', data.file)
  return request<QualityReport>('/api/v1/quality/reports/quick', {
    method: 'POST',
    body,
  })
}

export function deleteQualityReport(id: number) {
  return request<null>(`/api/v1/quality/reports/${id}`, {
    method: 'DELETE',
  })
}

export function getQualityReportBlob(id: number) {
  return requestBlob(`/api/v1/quality/reports/${id}/file`)
}
