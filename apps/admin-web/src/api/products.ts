import { request, requestBlob } from '@/api/http'
import type { PageData } from '@/types/common'
import type { Company } from '@/api/companies'
import type { SchoolOption } from '@/api/schools'
// 产品档案、图片及关联生产批次/二维码数据接口。
export type ProductStatus = 'enabled' | 'disabled'
export type ProductCategory =
  | 'short_sleeve_top'
  | 'long_sleeve_top'
  | 'shorts'
  | 'trousers'
  | 'outerwear'
  | 'set'
  | 'skirt'
  | 'shirt'
  | 'formalwear'
  | 'tshirt'
  | 'accessory'
export type ProductSchoolStage =
  | 'universal'
  | 'primary'
  | 'junior_high'
  | 'senior_high'
  | 'secondary_vocational'
  | 'higher_vocational'
  | 'kindergarten'
export type ProductGender = 'unisex' | 'male' | 'female'
export type ProductQrCodeType = 'product' | 'batch' | 'school'
export type ProductSeason =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'all_season'
export type ProductSize =
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | 'xxl'
  | '120'
  | '130'
  | '140'
  | '150'
  | '160'
  | '170'
export interface Product {
  id: number
  imageId?: number | null
  imageIds?: readonly number[]
  code?: string
  name?: string
  category?: ProductCategory
  schoolStage?: ProductSchoolStage
  gender?: ProductGender
  qrCodeType?: ProductQrCodeType
  season?: ProductSeason
  status?: ProductStatus
  createdAt?: string
  applicableSchools?: readonly string[]
  schoolIds?: readonly number[]
  schools?: readonly SchoolOption[]
  style?: string
  color?: string
  sizes?: readonly ProductSize[]
  fabricInfo?: string
  executionStandard?: string
  washingInstructions?: string
  safetyCategory?: string
  productionUnitName?: string
  productionUnitCreditCode?: string
  productionUnitAddress?: string
  productionUnitContact?: string
  productionUnitLicense?: string
  companyId?: number | null
  company?: Company | null
  batchCount?: number
  totalQuantity?: number
}
export interface ProductQrBatch {
  id: number
  batchNo: string
  total: number
  bound: number
  activated: number
  voided: number
  scans: number
}
export type ProductProductionStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
export interface ProductProductionStep {
  id: number
  nodeName: string
  nodeOrder: number
  custom: boolean
  status?: ProductProductionStepStatus
  employeeName?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  photoFileId?: number | null
}
export interface ProductProductionStepInput {
  processId: number | null
  content: string
  operatorName: string
  startedAt: string
  completedAt: string
  status: ProductProductionStepStatus
  notes: string
  photo: File | null
}
export interface ProductQualityReport {
  id: number
  name: string
  fileName: string
  conclusion?: 'qualified' | 'unqualified'
  status?: 'pending' | 'approved' | 'rejected' | 'expired'
  inspectionDate?: string
}
export interface ProductProductionBatch {
  id: number
  batchNo: string
  quantity?: number
  productionDate?: string
  status?: string
  factoryName?: string
  responsibleEmployeeName?: string
  qrTotal: number
  qrBatches: ProductQrBatch[]
  productionSteps: ProductProductionStep[]
}
export interface ProductDetail {
  product: Product
  batches: ProductProductionBatch[]
  qualityReports: ProductQualityReport[]
  access: { production: boolean; qrcode: boolean; quality: boolean }
}
export interface ProductInput {
  name: string
  code: string
  category: ProductCategory
  schoolStage: ProductSchoolStage
  gender: ProductGender
  season: ProductSeason
  /** @deprecated 仅供旧版未挂载表单组件保持类型兼容。 */
  schoolIds?: number[]
  images: File[]
  retainedImageIds: number[]
}
export interface ProductFilters {
  keyword: string
  schoolStage: ProductSchoolStage | ''
  category: ProductCategory | ''
}
export const productCategoryOptions = [
  { label: '短袖上衣', value: 'short_sleeve_top' },
  { label: '长袖上衣', value: 'long_sleeve_top' },
  { label: '短裤子', value: 'shorts' },
  { label: '长裤子', value: 'trousers' },
  { label: '外套', value: 'outerwear' },
  { label: '套装', value: 'set' },
  { label: '裙子', value: 'skirt' },
  { label: '衬衫', value: 'shirt' },
  { label: '礼服', value: 'formalwear' },
  { label: 'T桖', value: 'tshirt' },
  { label: '饰品', value: 'accessory' },
] satisfies Array<{ label: string; value: ProductCategory }>
export const productSchoolStageOptions = [
  { label: '通用', value: 'universal' },
  { label: '小学', value: 'primary' },
  { label: '初中', value: 'junior_high' },
  { label: '高中', value: 'senior_high' },
  { label: '中职', value: 'secondary_vocational' },
  { label: '高职', value: 'higher_vocational' },
  { label: '幼儿园', value: 'kindergarten' },
] satisfies Array<{ label: string; value: ProductSchoolStage }>
export const productGenderOptions = [
  { label: '通用款', value: 'unisex' },
  { label: '男款', value: 'male' },
  { label: '女款', value: 'female' },
] satisfies Array<{ label: string; value: ProductGender }>
export const productExecutionStandardOptions = [
  {
    label: 'GBT 31888-2015《中小学生校服》',
    value: '0',
  },
]
export const productSafetyCategoryOptions = [
  {
    label: 'GB 18401-2010《国家纺织产品基本安全技术规范》B类（14 周岁以上高中生适用）',
    value: '0',
  },
  {
    label: 'GB 31701-2015《婴幼儿及儿童纺织产品安全技术规范》B类（14 周岁及以下中小学生校服强制适用）',
    value: '1',
  },
]
export const productQrCodeTypeOptions = [
  { label: '一物一码', value: 'product' },
  { label: '一批一码', value: 'batch' },
  { label: '一校一码', value: 'school' },
] satisfies Array<{ label: string; value: ProductQrCodeType }>
export const productSeasonOptions = [
  { label: '春季', value: 'spring' },
  { label: '夏季', value: 'summer' },
  { label: '秋季', value: 'autumn' },
  { label: '冬季', value: 'winter' },
  { label: '四季通用', value: 'all_season' },
] satisfies Array<{ label: string; value: ProductSeason }>
export const productSizeOptions = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
  { label: 'XXL', value: 'xxl' },
  { label: '120', value: '120' },
  { label: '130', value: '130' },
  { label: '140', value: '140' },
  { label: '150', value: '150' },
  { label: '160', value: '160' },
  { label: '170', value: '170' },
] satisfies Array<{ label: string; value: ProductSize }>
const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString()
export const getProducts = (params: Record<string, string | number>) =>
  request<PageData<Product>>(`/api/v1/products?${qs(params)}`)
export const getProduct = (id: number) =>
  request<Product>(`/api/v1/products/${id}`)
export const checkProductCodeExists = (
  code: string,
  excludeId?: number | null,
) =>
  request<{ exists: boolean }>(
    `/api/v1/products/code-availability?${qs({
      code,
      excludeId: excludeId || '',
    })}`,
  )
export const getProductDetail = (id: number) =>
  request<ProductDetail>(`/api/v1/products/${id}/detail`)
export const createProductBatchStep = (
  batchId: number,
  data: ProductProductionStepInput,
) => {
  const { photo, ...payload } = data
  const body = new FormData()
  body.append('payload', JSON.stringify(payload))
  if (photo) body.append('photo', photo)
  return request<ProductProductionStep>(
    `/api/v1/production/batches/${batchId}/steps`,
    { method: 'POST', body },
  )
}
export const deleteProductBatchStep = (batchId: number, stepId: number) =>
  request<null>(`/api/v1/production/batches/${batchId}/steps/${stepId}`, {
    method: 'DELETE',
  })
// 产品结构化字段序列化到 payload，图片作为 multipart 文件提交。
function body(data: ProductInput) {
  const form = new FormData()
  const { images, ...payload } = data
  form.append('payload', JSON.stringify(payload))
  images.forEach((image) => form.append('images', image))
  return form
}
export const createProduct = (data: ProductInput) =>
  request<Product>('/api/v1/products', { method: 'POST', body: body(data) })
export const updateProduct = (id: number, data: ProductInput) =>
  request<Product>(`/api/v1/products/${id}`, {
    method: 'PUT',
    body: body(data),
  })
export const updateProductStatus = (id: number, status: ProductStatus) =>
  request<Product>(`/api/v1/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
export const deleteProduct = (id: number) =>
  request<null>(`/api/v1/products/${id}`, { method: 'DELETE' })
export const getProductImage = (id: number) =>
  requestBlob(`/api/v1/products/images/${id}`)
