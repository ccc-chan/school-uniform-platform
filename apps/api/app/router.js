'use strict'

module.exports = (app) => {
  const { controller, router } = app

  // 登录态校验是所有管理端受保护接口的第一道访问边界。
  const auth = app.middleware.auth()

  // 对登录、密码重置和公开扫码分别限流，避免高频尝试互相占用配额。
  const loginRateLimit = app.middleware.rateLimit({
    keyPrefix: 'auth-login',
    windowMs: 15 * 60 * 1000,
    max: 10,
    key: (ctx) =>
      `${ctx.ip}:${String(ctx.request.body?.account || '')
        .trim()
        .toLowerCase()}`,
  })
  const resetPasswordRateLimit = app.middleware.rateLimit({
    keyPrefix: 'auth-reset-password',
    windowMs: 60 * 60 * 1000,
    max: 5,
    key: (ctx) =>
      `${ctx.ip}:${String(ctx.request.body?.account || '')
        .trim()
        .toLowerCase()}`,
  })
  const publicScanRateLimit = app.middleware.rateLimit({
    keyPrefix: 'public-qrcode-scan',
    windowMs: 60 * 1000,
    max: 120,
  })

  // 菜单权限控制模块可见性，操作权限进一步限制增删改等具体能力。
  const superAdmin = app.middleware.superAdmin()
  const dashboardMenu = app.middleware.menuPermission({ code: 'dashboard' })
  const productMenu = app.middleware.menuPermission({ code: 'products' })
  const productPermission = code => app.middleware.operationPermission({ code })
  const qrcodeMenu = app.middleware.menuPermission({ code: 'qrcodes' })
  const qrcodePermission = code => app.middleware.operationPermission({ code })
  const productionMenu = app.middleware.menuPermission({ code: 'production' })
  const productionPermission = code => app.middleware.operationPermission({ code })
  const qualityMenu = app.middleware.menuPermission({ code: 'quality' })
  const qualityPermission = code => app.middleware.operationPermission({ code })
  const brandMenu = app.middleware.menuPermission({ code: 'brand' })
  const brandPermission = code => app.middleware.operationPermission({ code })
  const analyticsMenu = app.middleware.menuPermission({ code: 'analytics' })
  const analyticsPermission = code => app.middleware.operationPermission({ code })

  // 品牌内容类型与权限码一一对应，防止客户端通过未知类型绕过权限检查。
  const brandAssetPermissions = {
    story: 'brand.story.manage',
    factory: 'brand.factory.manage',
    video: 'brand.video.manage',
  }
  const brandAssetPermission = async (ctx, next) => {
    const code = brandAssetPermissions[ctx.params.type]
    if (!code) {
      ctx.status = 404
      ctx.body = { code: 404, message: '品牌内容类型无效', data: null }
      return
    }
    await brandPermission(code)(ctx, next)
  }
  const systemMenu = app.middleware.menuPermission({ code: 'system' })

  // 公开基础接口。
  router.get('/api/v1/health', controller.health.index)
  router.get('/api/v1/auth/captcha', controller.auth.captcha)

  // 认证接口：敏感的匿名请求单独限流，登录后的操作必须校验令牌。
  router.post(
    '/api/v1/auth/login',
    loginRateLimit,
    controller.auth.login,
  )
  router.post(
    '/api/v1/auth/reset-password',
    resetPasswordRateLimit,
    controller.auth.resetPassword,
  )
  router.post('/api/v1/auth/logout', auth, controller.auth.logout)
  router.put('/api/v1/auth/password', auth, controller.auth.changePassword)
  router.get('/api/v1/auth/menus', auth, controller.auth.menus)
  router.get('/api/v1/auth/permissions', auth, controller.auth.permissions)

  // 面向消费者的公开扫码入口不要求登录，但会限制单 IP 的请求频率。
  router.post(
    '/api/v1/public/qrcodes/:code/scan',
    publicScanRateLimit,
    controller.analytics.recordScan,
  )

  // 管理端业务接口依次经过登录、菜单和具体操作权限校验。
  router.get('/api/v1/dashboard/overview', auth, dashboardMenu, controller.dashboard.overview)

  // 产品中心。
  router.get('/api/v1/products', auth, productMenu, productPermission('product.view'), controller.products.index)
  router.get('/api/v1/products/images/:id', auth, productMenu, productPermission('product.field.image'), controller.products.image)
  router.get('/api/v1/products/:id/detail', auth, productMenu, productPermission('product.view'), controller.products.detail)
  router.get('/api/v1/products/:id', auth, productMenu, productPermission('product.edit'), controller.products.show)
  router.post('/api/v1/products', auth, productMenu, productPermission('product.create'), controller.products.create)
  router.put('/api/v1/products/:id', auth, productMenu, productPermission('product.edit'), controller.products.update)
  router.patch('/api/v1/products/:id/status', auth, productMenu, productPermission('product.status'), controller.products.updateStatus)
  router.delete('/api/v1/products/:id', auth, productMenu, productPermission('product.delete'), controller.products.destroy)

  // 二维码中心。
  router.get('/api/v1/qrcodes/overview', auth, qrcodeMenu, qrcodePermission('qrcode.view'), controller.qrcodes.overview)
  router.get('/api/v1/qrcodes/products', auth, qrcodeMenu, controller.qrcodes.products)
  router.get('/api/v1/qrcodes/batches', auth, qrcodeMenu, qrcodePermission('qrcode.bind'), controller.qrcodes.batches)
  router.get('/api/v1/qrcodes/label-print/batches', auth, qrcodeMenu, qrcodePermission('qrcode.view'), controller.qrcodes.labelPrintBatches)
  router.get('/api/v1/qrcodes/label-print/batches/:batchNo', auth, qrcodeMenu, qrcodePermission('qrcode.view'), controller.qrcodes.labelPrintBatch)
  router.post('/api/v1/qrcodes/generate', auth, qrcodeMenu, qrcodePermission('qrcode.generate'), controller.qrcodes.generate)
  router.post('/api/v1/qrcodes/batch-generate', auth, qrcodeMenu, qrcodePermission('qrcode.batch_generate'), controller.qrcodes.batchGenerate)
  router.post('/api/v1/qrcodes/bind', auth, qrcodeMenu, qrcodePermission('qrcode.bind'), controller.qrcodes.bind)

  // 生产中心的多类资源复用同一组控制器方法，由 URL 解析具体资源类型。
  router.get('/api/v1/production/options', auth, productionMenu, productionPermission('production.view'), controller.production.options)
  router.get('/api/v1/production/orders', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.get('/api/v1/production/orders/:id', auth, productionMenu, productionPermission('production.view'), controller.production.show)
  router.post('/api/v1/production/orders', auth, productionMenu, productionPermission('production.order.create'), controller.production.create)
  router.put('/api/v1/production/orders/:id', auth, productionMenu, productionPermission('production.order.edit'), controller.production.update)
  router.patch('/api/v1/production/orders/:id/status', auth, productionMenu, productionPermission('production.order.status'), controller.production.updateStatus)
  router.get('/api/v1/production/batches', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.post('/api/v1/production/batches', auth, productionMenu, productionPermission('production.batch.manage'), controller.production.create)
  router.put('/api/v1/production/batches/:id', auth, productionMenu, productionPermission('production.batch.manage'), controller.production.update)
  router.patch('/api/v1/production/batches/:id/status', auth, productionMenu, productionPermission('production.batch.manage'), controller.production.updateStatus)
  router.post('/api/v1/production/batches/:id/steps', auth, productionMenu, productionPermission('production.record.manage'), controller.production.createBatchStep)
  router.delete('/api/v1/production/batches/:id/steps/:stepId', auth, productionMenu, productionPermission('production.record.manage'), controller.production.deleteBatchStep)
  router.get('/api/v1/production/processes', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.post('/api/v1/production/processes', auth, productionMenu, productionPermission('production.process.manage'), controller.production.create)
  router.put('/api/v1/production/processes/:id', auth, productionMenu, productionPermission('production.process.manage'), controller.production.update)
  router.patch('/api/v1/production/processes/:id/status', auth, productionMenu, productionPermission('production.process.manage'), controller.production.updateStatus)
  router.get('/api/v1/production/records', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.post('/api/v1/production/records', auth, productionMenu, productionPermission('production.record.manage'), controller.production.create)
  router.put('/api/v1/production/records/:id', auth, productionMenu, productionPermission('production.record.manage'), controller.production.update)
  router.get('/api/v1/production/factories', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.post('/api/v1/production/factories', auth, productionMenu, productionPermission('production.factory.manage'), controller.production.create)
  router.put('/api/v1/production/factories/:id', auth, productionMenu, productionPermission('production.factory.manage'), controller.production.update)
  router.patch('/api/v1/production/factories/:id/status', auth, productionMenu, productionPermission('production.factory.manage'), controller.production.updateStatus)
  router.get('/api/v1/production/outbounds', auth, productionMenu, productionPermission('production.view'), controller.production.index)
  router.post('/api/v1/production/outbounds', auth, productionMenu, productionPermission('production.outbound.manage'), controller.production.create)
  router.put('/api/v1/production/outbounds/:id', auth, productionMenu, productionPermission('production.outbound.manage'), controller.production.update)

  // 质量中心。
  router.get('/api/v1/quality/options', auth, qualityMenu, qualityPermission('quality.view'), controller.quality.options)
  router.get('/api/v1/quality/reports', auth, qualityMenu, qualityPermission('quality.view'), controller.quality.reports)
  router.post('/api/v1/quality/reports', auth, qualityMenu, qualityPermission('quality.report.create'), controller.quality.createReport)
  router.get('/api/v1/quality/reports/:id', auth, qualityMenu, qualityPermission('quality.view'), controller.quality.report)
  router.patch('/api/v1/quality/reports/:id/status', auth, qualityMenu, qualityPermission('quality.report.review'), controller.quality.reviewReport)
  router.get('/api/v1/quality/reports/:id/file', auth, qualityMenu, qualityPermission('quality.report.download'), controller.quality.reportFile)
  router.get('/api/v1/quality/items', auth, qualityMenu, qualityPermission('quality.view'), controller.quality.items)
  router.post('/api/v1/quality/items', auth, qualityMenu, qualityPermission('quality.item.manage'), controller.quality.createItem)
  router.put('/api/v1/quality/items/:id', auth, qualityMenu, qualityPermission('quality.item.manage'), controller.quality.updateItem)
  router.patch('/api/v1/quality/items/:id/status', auth, qualityMenu, qualityPermission('quality.item.manage'), controller.quality.updateItemStatus)
  router.get('/api/v1/quality/history', auth, qualityMenu, qualityPermission('quality.view'), controller.quality.history)

  // 品牌中心。
  router.get('/api/v1/brand/profile', auth, brandMenu, brandPermission('brand.view'), controller.brand.profile)
  router.put('/api/v1/brand/profile', auth, brandMenu, brandPermission('brand.profile.manage'), controller.brand.updateProfile)
  router.get('/api/v1/brand/media/:id', auth, brandMenu, brandPermission('brand.view'), controller.brand.media)
  router.get('/api/v1/brand/assets/:type', auth, brandMenu, brandPermission('brand.view'), controller.brand.assets)
  router.post('/api/v1/brand/assets/:type', auth, brandMenu, brandAssetPermission, controller.brand.createAsset)
  router.put('/api/v1/brand/assets/:type/:id', auth, brandMenu, brandAssetPermission, controller.brand.updateAsset)
  router.patch('/api/v1/brand/assets/:type/:id/status', auth, brandMenu, brandAssetPermission, controller.brand.updateAssetStatus)
  router.delete('/api/v1/brand/assets/:type/:id', auth, brandMenu, brandAssetPermission, controller.brand.deleteAsset)

  // 数据分析中心。
  router.get('/api/v1/analytics/options', auth, analyticsMenu, analyticsPermission('analytics.view'), controller.analytics.options)
  router.get('/api/v1/analytics/overview', auth, analyticsMenu, analyticsPermission('analytics.view'), controller.analytics.overview)

  // 系统管理；删除账号、角色和文件还需要超级管理员权限。
  router.get('/api/v1/system/employees', auth, systemMenu, controller.system.employees)
  router.post('/api/v1/system/employees', auth, systemMenu, controller.system.createEmployee)
  router.put('/api/v1/system/employees/:id', auth, systemMenu, controller.system.updateEmployee)
  router.patch('/api/v1/system/employees/:id/status', auth, systemMenu, controller.system.updateEmployeeStatus)
  router.post('/api/v1/system/employees/:id/reset-password', auth, systemMenu, controller.system.resetEmployeePassword)
  router.delete('/api/v1/system/employees/:id', auth, systemMenu, superAdmin, controller.system.deleteEmployee)
  router.get('/api/v1/system/roles', auth, systemMenu, controller.system.roles)
  router.post('/api/v1/system/roles', auth, systemMenu, controller.system.createRole)
  router.put('/api/v1/system/roles/:id', auth, systemMenu, controller.system.updateRole)
  router.patch('/api/v1/system/roles/:id/status', auth, systemMenu, controller.system.updateRoleStatus)
  router.delete('/api/v1/system/roles/:id', auth, systemMenu, superAdmin, controller.system.deleteRole)
  router.get('/api/v1/system/operation-logs', auth, systemMenu, controller.system.operationLogs)
  router.get('/api/v1/system/files', auth, systemMenu, controller.system.files)
  router.post('/api/v1/system/files', auth, systemMenu, controller.system.uploadFile)
  router.get('/api/v1/system/files/:id/download', auth, systemMenu, controller.system.downloadFile)
  router.delete('/api/v1/system/files/:id', auth, systemMenu, superAdmin, controller.system.deleteFile)
}
