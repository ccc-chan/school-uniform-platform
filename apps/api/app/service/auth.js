'use strict'

const { randomUUID } = require('node:crypto')
const { Service } = require('egg')

const sessions = new Map()
const SESSION_DURATION = 24 * 60 * 60 * 1000

class AuthService extends Service {
  authenticate({ account, password, captcha }) {
    const matched =
      account === 'admin' &&
      password === 'admin123' &&
      String(captcha).toUpperCase() === '7K9P'

    if (!matched) {
      return null
    }

    const profile = {
      id: 1,
      account: 'admin',
      name: '张三',
      role: '超级管理员',
    }
    const token = randomUUID()
    const expiresAt = Date.now() + SESSION_DURATION

    sessions.set(token, {
      profile,
      expiresAt,
    })

    return {
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      profile,
    }
  }

  resolveToken(token) {
    const session = sessions.get(token)

    if (!session) {
      return null
    }

    if (session.expiresAt <= Date.now()) {
      sessions.delete(token)
      return null
    }

    return session.profile
  }

  revokeToken(token) {
    sessions.delete(token)
  }
}

module.exports = AuthService
