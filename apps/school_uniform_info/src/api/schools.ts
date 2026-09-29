interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

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

export async function getSchools(keyword: string, schoolType: SchoolType | '', page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ keyword, schoolType, page: String(page), pageSize: '20' })
  const response = await fetch(`/api/v1/public/schools?${params}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  const body = await response.json().catch(() => null) as ApiEnvelope<SchoolPage> | null
  if (!response.ok || !body || body.code !== 200) {
    throw new Error(body?.message || '学校列表加载失败')
  }
  return body.data
}
