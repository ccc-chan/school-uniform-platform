'use strict'

const { createHash, randomUUID } = require('node:crypto')
const { Service } = require('egg')

const KEY_PREFIX = 'school-uniform'
const AUTH_CACHE_SECONDS = 5 * 60

/**
 * 集中管理 Redis Key、JSON 序列化、登录会话和权限缓存。
 *
 * 会话方法不吞掉 Redis 异常，因为登录状态属于安全边界；
 * 普通缓存读取失败时则回源数据库，避免缓存故障拖垮业务查询。
 */
class CacheService extends Service {
  get redis() {
    return this.app.redis
  }

  tokenDigest(token) {
    // Redis Key 不保存客户端原始 Token，降低日志或监控泄漏后的风险。
    return createHash('sha256').update(String(token)).digest('hex')
  }

  sessionKey(digest) {
    return `${KEY_PREFIX}:session:${digest}`
  }

  userSessionsKey(employeeId) {
    return `${KEY_PREFIX}:user-sessions:${employeeId}`
  }

  captchaKey(captchaId) {
    return `${KEY_PREFIX}:captcha:${captchaId}`
  }

  async readJson(key) {
    const value = await this.redis.get(key)
    if (!value) return null

    try {
      return JSON.parse(value)
    } catch {
      // 删除不可解析的异常缓存，防止后续请求持续命中坏数据。
      await this.redis.del(key)
      return null
    }
  }

  async writeJson(key, value, ttlSeconds) {
    await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlSeconds,
    )
  }

  async rememberJson(key, ttlSeconds, loader) {
    try {
      const cached = await this.readJson(key)
      if (cached !== null) return cached
    } catch (error) {
      // 普通缓存故障时回源数据库，并记录告警供运维排查。
      this.ctx.logger.warn(
        '[redis-cache] read failed for %s: %s',
        key,
        error.message,
      )
    }

    const value = await loader()

    try {
      await this.writeJson(key, value, ttlSeconds)
    } catch (error) {
      this.ctx.logger.warn(
        '[redis-cache] write failed for %s: %s',
        key,
        error.message,
      )
    }

    return value
  }

  async storeSession({ token, employeeId, expiresAt, profile }) {
    const digest = this.tokenDigest(token)
    const sessionKey = this.sessionKey(digest)
    const userKey = this.userSessionsKey(employeeId)
    const ttlSeconds = Math.max(
      1,
      Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
    )

    // 使用事务同时写入会话内容和用户会话索引，便于一键撤销全部设备。
    await this.redis
      .multi()
      .set(
        sessionKey,
        JSON.stringify({
          employeeId: Number(employeeId),
          expiresAt: new Date(expiresAt).toISOString(),
          profile,
        }),
        'EX',
        ttlSeconds,
      )
      .sadd(userKey, digest)
      .expire(userKey, ttlSeconds)
      .exec()
  }

  async readSession(token) {
    if (!token) return null
    return this.readJson(
      this.sessionKey(this.tokenDigest(token)),
    )
  }

  async removeSession(token) {
    if (!token) return

    const digest = this.tokenDigest(token)
    const sessionKey = this.sessionKey(digest)
    const session = await this.readJson(sessionKey)
    const transaction = this.redis.multi().del(sessionKey)

    if (session?.employeeId) {
      transaction.srem(
        this.userSessionsKey(session.employeeId),
        digest,
      )
    }

    await transaction.exec()
  }

  async removeUserSessions(employeeId, exceptToken = '') {
    const userKey = this.userSessionsKey(employeeId)
    const digests = await this.redis.smembers(userKey)
    const exceptDigest = exceptToken
      ? this.tokenDigest(exceptToken)
      : ''

    const removed = digests.filter(
      (digest) => digest !== exceptDigest,
    )
    const transaction = this.redis.multi()

    for (const digest of removed) {
      transaction.del(this.sessionKey(digest))
      transaction.srem(userKey, digest)
    }

    if (!exceptDigest) transaction.del(userKey)
    await transaction.exec()
  }

  async storeCaptcha(code, ttlSeconds) {
    const captchaId = randomUUID()

    await this.redis.set(
      this.captchaKey(captchaId),
      String(code).toUpperCase(),
      'EX',
      ttlSeconds,
    )

    return captchaId
  }

  async takeCaptcha(captchaId) {
    if (!captchaId) return null

    // Lua 保证读取和删除原子执行，使验证码只能被验证一次。
    return this.redis.eval(
      `
        local value = redis.call('GET', KEYS[1])
        if value then
          redis.call('DEL', KEYS[1])
        end
        return value
      `,
      1,
      this.captchaKey(captchaId),
    )
  }

  async authorizationVersion() {
    const key = `${KEY_PREFIX}:authorization:version`

    try {
      await this.redis.set(key, '1', 'NX')
      return (await this.redis.get(key)) || '1'
    } catch (error) {
      // Redis 缓存异常不阻断权限数据库查询。
      this.ctx.logger.warn(
        '[redis-cache] authorization version unavailable: %s',
        error.message,
      )
      return '1'
    }
  }

  async rememberAuthorization(type, employeeId, loader) {
    const version = await this.authorizationVersion()
    const key =
      `${KEY_PREFIX}:authorization:${version}:${type}:${employeeId}`

    return this.rememberJson(
      key,
      AUTH_CACHE_SECONDS,
      loader,
    )
  }

  async invalidateAuthorization() {
    // 角色或员工授权变化后递增全局版本，旧缓存会在 TTL 到期后自然清理。
    await this.redis.incr(
      `${KEY_PREFIX}:authorization:version`,
    )
  }
}

module.exports = CacheService
