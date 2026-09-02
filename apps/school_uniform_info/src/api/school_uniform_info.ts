interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface SchoolUniformInfo {
  code: string
  status: string
  productCode: string | null
  productName: string | null
  category: string | null
  season: string | null
  style: string | null
  color: string | null
  fabricInfo: string | null
  executionStandard: string | null
  productionBatch: string | null
  productSku: string | null
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
