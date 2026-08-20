// 健康检查直接使用 fetch，不依赖登录会话和统一业务响应解包。
export interface HealthResult {
  code: number
  message: string
  data: {
    service: string
    status: string
    timestamp: string
  }
}

export async function getHealth(): Promise<HealthResult> {
  const response = await fetch('/api/v1/health')

  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`)
  }

  return response.json() as Promise<HealthResult>
}
