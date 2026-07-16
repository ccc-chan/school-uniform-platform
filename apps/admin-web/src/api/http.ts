import { readAuthSession } from '@/utils/auth-session'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  const session = readAuthSession()

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  if (init.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })
  const result = (await response.json()) as ApiResponse<T>

  if (!response.ok || result.code !== 200) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}
