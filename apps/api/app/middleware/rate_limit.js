'use strict'

const { createHash } = require('node:crypto')

const RATE_LIMIT_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  local ttl = redis.call('PTTL', KEYS[1])
  return { current, ttl }
`

/**
 * 创建基于 Redis 的固定窗口限流中间件。
 *
 * 所有 Egg Worker 和应用实例共享同一个计数器，避免原进程内 Map
 * 在多进程部署时出现每个进程单独计算额度的问题。
 */
module.exports = ({
  windowMs = 60 * 1000,
  max = 60,
  keyPrefix = 'default',
  key,
} = {}) =>
  async function rateLimit(ctx, next) {
    const identity =
      typeof key === 'function' ? key(ctx) : ctx.ip
    const identityDigest = createHash('sha256')
      .update(String(identity || ctx.ip))
      .digest('hex')

    const bucketKey =
      `school-uniform:rate:${keyPrefix}:${identityDigest}`

    // Lua 原子执行 INCR 与过期时间设置，避免产生永不过期的计数键。
    const [count, ttl] = await ctx.app.redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      bucketKey,
      String(windowMs),
    )

    if (Number(count) > max) {
      ctx.set(
        'Retry-After',
        String(Math.max(1, Math.ceil(Number(ttl) / 1000))),
      )
      ctx.status = 429
      ctx.body = {
        code: 429,
        message: '请求过于频繁，请稍后重试',
        data: null,
      }
      return
    }

    await next()
  }
