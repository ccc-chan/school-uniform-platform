import { request } from '@/api/http'
import type { ManagedFile } from '@/types/system'

/**
 * 公共文件上传接口。
 */
export function uploadFile(file: File) {
  const body = new FormData()
  body.append('file', file)

  return request<ManagedFile>('/api/v1/system/files', {
    method: 'POST',
    body,
  })
}
