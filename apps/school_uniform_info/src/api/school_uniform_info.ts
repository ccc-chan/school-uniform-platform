interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export type QrCodeType = 'product' | 'batch' | 'school'

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
  category: string | null
  season: string | null
  style: string | null
  color: string | null
  sizes: string[]
  applicableSchools: string[]
  fabricInfo: string | null
  executionStandard: string | null
  washingInstructions: string | null
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
