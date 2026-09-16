'use strict'

const { Service } = require('egg')

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status })
}

class StudentBindingService extends Service {
  async resolve(code, transaction) {
    const qr = await this.app.model.QrCode.findOne({
      where: { code },
      ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    })
    if (!qr || qr.disabled || qr.status === 'voided') {
      fail('二维码不存在、已停用或已作废', 404)
    }
    const batch = await this.app.model.QrGenerationBatch.findByPk(qr.generationBatchId, { transaction })
    const productId = qr.productId || batch?.productId
    const product = productId
      ? await this.app.model.Product.findByPk(productId, { transaction })
      : null
    if (!product || (product.qrCodeType && product.qrCodeType !== 'product')) {
      fail('仅一品一码支持绑定学生')
    }
    return { qr, product }
  }

  publicInfo(binding) {
    if (!binding) return null
    return {
      studentName: binding.studentName,
      grade: binding.grade || '',
      className: binding.className || '',
      parentName: binding.parentName,
      phoneMasked: /^1[3-9]\d{9}$/.test(binding.phone || '')
        ? `${binding.phone.slice(0, 3)}****${binding.phone.slice(-4)}`
        : '已隐藏',
      boundAt: this.ctx.helper.formatDateTime(binding.createdAt),
    }
  }

  async show(code) {
    const { qr } = await this.resolve(code)
    return this.publicInfo(await this.app.model.QrStudentBinding.findByPk(qr.id))
  }

  async create(code, value) {
    return this.app.model.transaction(async (transaction) => {
      // 与管理端绑定、停用操作共用二维码行锁，首次绑定不可覆盖。
      const { qr, product } = await this.resolve(code, transaction)
      const existing = await this.app.model.QrStudentBinding.findByPk(qr.id, { transaction })
      if (existing) fail('这件校服已绑定学生，请查看学生信息', 409)
      let schools = product.applicableSchools
      if (typeof schools === 'string') {
        try { schools = JSON.parse(schools) } catch { schools = [] }
      }
      const binding = await this.app.model.QrStudentBinding.create({
        qrCodeId: qr.id,
        schoolName: Array.isArray(schools) && schools.length === 1 ? String(schools[0]).slice(0, 100) : '',
        studentName: value.studentName,
        studentNo: value.studentNo,
        grade: value.grade,
        className: value.className,
        parentName: value.parentName,
        parentRelation: value.parentRelation,
        phone: value.phone,
        version: 1,
      }, { transaction })
      return this.publicInfo(binding)
    })
  }
}

module.exports = StudentBindingService
