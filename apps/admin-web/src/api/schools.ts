import { request } from '@/api/http'

export interface SchoolOption {
  id: number
  code: string
  name: string
  schoolType: string
  address: string
}

export interface SchoolPage {
  items: SchoolOption[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export const schoolTypeOptions = [
  '幼儿园',
  '小学',
  '初中',
  '高中',
  '中职',
  '高等学校',
  '特殊教育',
  '专门学校',
] as const

export type SchoolType = typeof schoolTypeOptions[number]

export function getSchools(keyword: string, schoolType: SchoolType | '', page: number, pageSize = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ keyword, schoolType, page: String(page), pageSize: String(pageSize) })
  return request<SchoolPage>(`/api/v1/schools?${params}`, { signal })
}
