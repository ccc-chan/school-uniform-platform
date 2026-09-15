import { request } from '@/api/http'
import type { PageData } from '@/types/common'

export type QrManagementStatus = 'unbound' | 'bound' | 'activated' | 'voided' | 'disabled'
export interface QrManagementFilters {
  code: string
  studentName: string
  phone: string
  schoolName: string
  status: QrManagementStatus | ''
}
export interface QrStudentInput {
  schoolName: string
  className: string
  studentName: string
  parentName: string
  phone: string
  version: number
  studentGender: string
  grade: string
  studentNo: string
  parentRelation: string
}
export interface QrManagementItem {
  id: number
  code: string
  qrStatus: string
  disabled: boolean
  productName: string | null
  productCode: string | null
  productSizes: string[] | null
  productSku: string | null
  productionBatch: string | null
  schoolName: string | null
  className: string | null
  studentName: string | null
  studentGender: string | null
  grade: string | null
  studentNo: string | null
  parentName: string | null
  parentRelation: string | null
  phoneMasked: string | null
  version: number
  status: QrManagementStatus
  scanCount: number
}
export interface QrManagementDetail extends QrManagementItem {
  brandName: string | null
  style: string | null
  color: string | null
  productionDate: string | null
  factoryName: string | null
  hasQualityReport: boolean
  generatedAt: string | null
  studentBoundAt: string | null
  firstScannedAt: string | null
  lastScannedAt: string | null
}
export interface QrManagementData extends PageData<QrManagementItem> {
  statistics: { total: number; bound: number; activated: number; todayScans: number }
  schools: string[]
}
export interface QrScanSummary {
  todayScans: number
  normalScans: number
  duplicateScans: number
  abnormalScans: number
}
export interface QrScanItem {
  id: number
  code: string
  studentName: string | null
  scanType: string
  scannedAt: string
}
export interface QrScanData extends PageData<QrScanItem> {
  summary: QrScanSummary
}
export const qrManagementStatusMap = {
  unbound: { label: '待绑定学生', color: 'default' },
  bound: { label: '已绑定学生', color: 'green' },
  activated: { label: '已激活', color: 'green' },
  voided: { label: '已作废', color: 'red' },
  disabled: { label: '已停用', color: 'orange' },
}
export function searchQrManagement(filters: QrManagementFilters, page: number, pageSize: number, signal?: AbortSignal) {
  return request<QrManagementData>('/api/v1/qr-management/search', {
    method: 'POST', body: JSON.stringify({ ...filters, page, pageSize }), signal,
  })
}
export function saveQrStudent(id: number, value: QrStudentInput) {
  return request<{ id: number }>(`/api/v1/qr-management/${id}/student`, {
    method: 'PUT', body: JSON.stringify(value),
  })
}
export function getQrScans(id: number, page: number, signal?: AbortSignal) {
  return request<QrScanData>(`/api/v1/qr-management/${id}/scans?page=${page}&pageSize=10`, { signal })
}
export function getQrDetail(id: number, signal?: AbortSignal) {
  return request<QrManagementDetail>(`/api/v1/qr-management/${id}`, { signal })
}
export function setQrDisabled(id: number, disabled: boolean, expectedDisabled: boolean) {
  return request<{ id: number; disabled: boolean }>(`/api/v1/qr-management/${id}/availability`, {
    method: 'PATCH', body: JSON.stringify({ disabled, expectedDisabled }),
  })
}
