'use strict'

module.exports = (app) => {
  const { controller, router } = app
  const auth = app.middleware.auth()

  router.get('/api/v1/health', controller.health.index)
  router.post('/api/v1/auth/login', controller.auth.login)
  router.post('/api/v1/auth/logout', auth, controller.auth.logout)
  router.get('/api/v1/dashboard/overview', auth, controller.dashboard.overview)
}
