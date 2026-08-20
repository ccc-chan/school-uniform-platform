'use strict'

// 字段名会先归一化，因此可同时识别 password_hash、passwordHash 等写法。
const sensitiveKeys = new Set([
  'password',
  'passwordhash',
  'temporarypassword',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'captcha',
  'secret',
])

// 忽略大小写、下划线和短横线，统一匹配敏感字段名。
function normalizeKey(key) {
  return String(key).replace(/[_-]/g, '').toLowerCase()
}

// 递归复制数据并替换敏感值，避免密码、令牌等信息进入操作日志。
function sanitize(value) {
  if (Array.isArray(value)) return value.map((item) => sanitize(item))
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeys.has(normalizeKey(key)) ? '[已脱敏]' : sanitize(item),
    ]),
  )
}

// 文件流不读取具体内容，只记录状态、媒体类型和下载标记。
function responseJson(ctx) {
  if (!ctx.body || typeof ctx.body.pipe === 'function') {
    return {
      status: ctx.status,
      contentType: ctx.type,
      fileDownload: true,
    }
  }
  return sanitize(ctx.body)
}

module.exports = () =>
  async function operationLogDetail(ctx, next) {
    // 先执行下游业务逻辑，响应生成后再补充日志详情。
    await next()

    // 业务服务可在一次请求中记录多条日志，并把 ID 汇总到请求状态。
    const logIds = ctx.state.operationLogIds || []
    if (!logIds.length) return

    const response = responseJson(ctx)

    try {
      const logs = await ctx.app.model.OperationLog.findAll({
        where: { id: logIds },
      })

      // 单条日志更新失败不影响其他日志，也不改变已经生成的业务响应。
      const results = await Promise.allSettled(
        logs.map((log) =>
          log.update({
            detail: {
              ...log.detail,
              response,
            },
          }),
        ),
      )

      for (const result of results) {
        if (result.status === 'rejected') {
          ctx.logger.error(
            '[operation-log-detail] update failed: %s',
            result.reason?.message || result.reason,
          )
        }
      }
    } catch (error) {
      // 审计详情写入失败只记录服务端错误，避免覆盖原接口响应。
      ctx.logger.error(
        '[operation-log-detail] query failed: %s',
        error.message,
      )
    }
  }
