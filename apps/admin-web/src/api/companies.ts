import { request, requestBlob } from '@/api/http'
import type { PageData } from '@/types/common'

export type CompanyStatus = 'enabled' | 'disabled'
export interface Company {
  id: number
  name: string
  englishName: string
  creditCode: string
  legalRepresentative: string
  industry: string
  region: string
  address: string
  contactPhone: string
  licenseFileId: number | null
  status: CompanyStatus
  createdAt?: string
}
export type CompanyInput = Omit<Company, 'id' | 'status' | 'createdAt' | 'licenseFileId'> & { license: File | null }
export interface CompanyFilters { keyword: string; status: CompanyStatus | '' }

const qs = (params: Record<string, string | number>) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)])).toString()
export const getCompanies = (params: Record<string, string | number>) => request<PageData<Company>>(`/api/v1/companies?${qs(params)}`)
export const getCompanyOptions = () => request<Company[]>('/api/v1/companies/options')
function body(data: CompanyInput) { const form = new FormData(); const { license, ...payload } = data; form.append('payload', JSON.stringify(payload)); if (license) form.append('license', license); return form }
export const createCompany = (data: CompanyInput) => request<Company>('/api/v1/companies', { method: 'POST', body: body(data) })
export const updateCompany = (id: number, data: CompanyInput) => request<Company>(`/api/v1/companies/${id}`, { method: 'PUT', body: body(data) })
export const updateCompanyStatus = (id: number, status: CompanyStatus) => request<Company>(`/api/v1/companies/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const deleteCompany = (id: number) => request<null>(`/api/v1/companies/${id}`, { method: 'DELETE' })
export const getCompanyLicense = (id: number) => requestBlob(`/api/v1/companies/${id}/license`)
