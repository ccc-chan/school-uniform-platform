const configuredBaseUrl = String(
  import.meta.env.VITE_QR_PUBLIC_BASE_URL || '',
).trim()

const allowHttpTraceUrl =
  import.meta.env.DEV ||
  import.meta.env.VITE_QR_ALLOW_HTTP_IN_TEST === 'true'

/**
 * 生成手机扫码后可直接打开的 URL 型二维码载荷。
 */
export function buildQrTraceUrl(code: string) {
  const normalizedCode = code.trim()
  if (!normalizedCode) throw new Error('二维码编号不能为空')

  const baseUrl = configuredBaseUrl || window.location.origin
  const url = new URL(
    `/trace/${encodeURIComponent(normalizedCode)}`,
    baseUrl,
  )

  if (!allowHttpTraceUrl && url.protocol !== 'https:') {
    throw new Error('生产环境二维码追溯地址必须使用 HTTPS')
  }

  return url.toString()
}
