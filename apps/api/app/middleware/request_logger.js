/*
 * @Author: Chan
 * @Date: 2026-08-26 11:46:27
 * @LastEditors: chan
 * @LastEditTime: 2026-08-26 13:04:30
 * @FilePath: /school-uniform-platform/apps/api/app/middleware/request_logger.js
 * @Description:
 *
 */
'use strict'

/**
 * 请求日志中间件 - 记录接口请求参数和返回参数
 * 用于开发环境和测试环境，生产环境需谨慎使用（可能泄露敏感信息）
 */
module.exports = () => {
  return async function requestLogger(ctx, next) {
    const startTime = Date.now()
    const { method, url, path } = ctx

    // 记录请求信息
    const requestInfo = {
      method,
      url,
      path,
      query: ctx.query,
      body: ctx.request.body,
      params: ctx.params,
      headers: {
        'user-agent': ctx.get('user-agent'),
        'x-real-ip': ctx.get('x-real-ip'),
      },
    }

    try {
      await next()
    } finally {
      const duration = Date.now() - startTime
      const statusCode = ctx.status

      // 过滤敏感字段
      const sanitizeData = (data) => {
        if (!data || typeof data !== 'object') return data

        const sensitiveFields = [
          'password',
          'token',
          'authorization',
          'secret',
          'key',
          'id_card',
          'phone',
          'mobile',
        ]

        if (Array.isArray(data)) {
          return data.map(sanitizeData)
        }

        const sanitized = { ...data }
        Object.keys(sanitized).forEach((key) => {
          const lowerKey = key.toLowerCase()
          if (sensitiveFields.some((field) => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]'
          } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeData(sanitized[key])
          }
        })

        return sanitized
      }

      // 记录日志
      ctx.logger.info('[HTTP Request]', {
        request: sanitizeData(requestInfo),
        response: {
          status: statusCode,
          body: sanitizeData(ctx.body),
        },
        duration: `${duration}ms`,
        userId: ctx.userId || ctx.currentUserId || 'anonymous',
      })
    }
  }
}
