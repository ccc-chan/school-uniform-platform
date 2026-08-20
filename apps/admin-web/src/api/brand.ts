import { request, requestBlob } from '@/api/http'

// 品牌资料与品牌内容接口，包含图片和视频的 multipart 上传。
export type BrandAssetType = 'story' | 'factory' | 'video'
export type BrandAssetStatus = 'enabled' | 'disabled'

export interface BrandProfile {
  id: number | null
  name?: string
  logoFileId?: number | null
  logoFileName?: string
  introduction?: string
  website?: string
  phone?: string
  updatedAt: string
}

export interface BrandProfileInput {
  name: string
  introduction: string
  website: string
  phone: string
  logo: File | null
}

export interface BrandAsset {
  id: number
  type: BrandAssetType
  title: string
  subtitle: string
  content: string
  location: string
  coverFileId: number | null
  coverFileName: string
  mediaFileId: number | null
  mediaFileName: string
  sort: number
  status: BrandAssetStatus
  updatedAt: string
}

export interface BrandAssetInput {
  title: string
  subtitle: string
  content: string
  location: string
  sort: number
  status: BrandAssetStatus
  cover: File | null
  media: File | null
}

export interface BrandAssetPage {
  items: BrandAsset[]
  total: number
  page: number
  pageSize: number
}

function profileBody(input: BrandProfileInput) {
  // 结构化字段放入 payload，文件使用独立 multipart 字段上传。
  const { logo, ...payload } = input
  const body = new FormData()
  body.append('payload', JSON.stringify(payload))
  if (logo) body.append('logo', logo)
  return body
}

function assetBody(input: BrandAssetInput) {
  // 封面和媒体文件分字段提交，便于后端按内容类型分别校验。
  const { cover, media, ...payload } = input
  const body = new FormData()
  body.append('payload', JSON.stringify(payload))
  if (cover) body.append('cover', cover)
  if (media) body.append('media', media)
  return body
}

function queryString(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, String(value)]),
  ).toString()
}

export function getBrandProfile() {
  return request<BrandProfile>('/api/v1/brand/profile')
}

export function updateBrandProfile(input: BrandProfileInput) {
  return request<BrandProfile>('/api/v1/brand/profile', {
    method: 'PUT',
    body: profileBody(input),
  })
}

export function getBrandAssets(
  type: BrandAssetType,
  params: Record<string, string | number>,
) {
  return request<BrandAssetPage>(
    `/api/v1/brand/assets/${type}?${queryString(params)}`,
  )
}

export function createBrandAsset(
  type: BrandAssetType,
  input: BrandAssetInput,
) {
  return request<BrandAsset>(`/api/v1/brand/assets/${type}`, {
    method: 'POST',
    body: assetBody(input),
  })
}

export function updateBrandAsset(
  type: BrandAssetType,
  id: number,
  input: BrandAssetInput,
) {
  return request<BrandAsset>(`/api/v1/brand/assets/${type}/${id}`, {
    method: 'PUT',
    body: assetBody(input),
  })
}

export function updateBrandAssetStatus(
  type: BrandAssetType,
  id: number,
  status: BrandAssetStatus,
) {
  return request<BrandAsset>(`/api/v1/brand/assets/${type}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteBrandAsset(type: BrandAssetType, id: number) {
  return request<null>(`/api/v1/brand/assets/${type}/${id}`, {
    method: 'DELETE',
  })
}

export function getBrandMedia(id: number) {
  return requestBlob(`/api/v1/brand/media/${id}`)
}
