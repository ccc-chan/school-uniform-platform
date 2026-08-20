import { readAuthSession } from '@/utils/auth-session'

// 后端统一 JSON 响应结构；request 最终只向调用方返回 data。
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

  // 每次请求读取最新会话，避免在模块初始化时缓存过期令牌。
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  // FormData 必须由浏览器自动生成包含 boundary 的 Content-Type。
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })
  const contentType = response.headers.get('content-type') ?? ''

  // 统一请求只接受 JSON，避免把代理错误页误当作业务数据。
  if (!contentType.includes('application/json')) {
    throw new Error(
      response.ok
        ? '服务器响应格式异常'
        : `服务暂时不可用（${response.status}）`,
    )
  }

  const result = (await response.json()) as ApiResponse<T>

  // HTTP 状态和业务 code 任一失败，都转换为可被页面捕获的 Error。
  if (!response.ok || result.code !== 200) {
    throw new Error(result.message || '请求失败')
  }

  return result.data
}

export async function requestBlob(url: string) {
  // 文件下载同样携带认证令牌，但不执行 JSON 响应解包。
  const headers = new Headers()
  const session = readAuthSession()
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`)
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error('文件下载失败')
  return response.blob()
}
