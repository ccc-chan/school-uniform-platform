interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export type QrCodeType = 'product' | 'batch' | 'school'

export interface StudentBinding {
  studentName: string
  grade: string
  className: string
  parentName: string
  phoneMasked: string
  boundAt: string
}

export interface StudentBindingInput {
  studentName: string
  studentNo: string
  grade: string
  className: string
  parentName: string
  parentRelation: '爸爸' | '妈妈' | '其他监护人'
  phone: string
  parentAuthorized: boolean
}

export class StudentBindingError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function requestStudentBinding(
  code: string,
  value?: StudentBindingInput,
): Promise<StudentBinding | null> {
  const response = await fetch(`/api/v1/public/qrcodes/${encodeURIComponent(code)}/student`, {
    method: value ? 'POST' : 'GET',
    headers: { Accept: 'application/json', ...(value ? { 'Content-Type': 'application/json' } : {}) },
    cache: 'no-store',
    ...(value ? { body: JSON.stringify(value) } : {}),
  })
  const body = await response.json().catch(() => null) as ApiEnvelope<StudentBinding | null> | null
  if (!response.ok || !body || body.code !== 200) {
    throw new StudentBindingError(body?.message || '学生信息请求失败，请重试', response.status)
  }
  return body.data
}

export type ProductionStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'exception'

export interface ProductionStep {
  id: number
  nodeName: string
  nodeOrder: number
  status: ProductionStepStatus
  operatorName: string
  startedAt: string
  completedAt: string
  notes: string
}

export interface SchoolUniformInfo {
  code: string
  status: string
  qrCodeType: QrCodeType
  productCode: string | null
  productName: string | null
  productImageUrl?: string | null
  category: string | null
  season: string | null
  style: string | null
  color: string | null
  sizes: string[]
  applicableSchools: string[]
  fabricInfo: string | null
  executionStandard: string | null
  washingInstructions: string | null
  productionUnitName: string | null
  productionUnitCreditCode: string | null
  productionUnitAddress: string | null
  productionUnitContact: string | null
  productionUnitLicense: string | null
  productionBatch: string | null
  productionDate: string | null
  productionFactoryName: string | null
  productionSteps: ProductionStep[]
  productSku: string | null
  scanCount: number
  firstScan: boolean
  firstScannedAt: string
  recorded: boolean
  scannedAt: string
}

export async function recordSchoolUniformInfoScan(
  code: string,
): Promise<SchoolUniformInfo> {
  const response = await fetch(
    `/api/v1/public/qrcodes/${encodeURIComponent(code)}/scan`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  const body = (await response.json().catch(() => null)) as
    | ApiEnvelope<SchoolUniformInfo>
    | null

  if (!response.ok || !body || body.code !== 200) {
    throw new Error(body?.message || '未查询到这件校服的信息')
  }

  return body.data
}
