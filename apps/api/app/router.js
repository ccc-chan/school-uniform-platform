'use strict'

module.exports = (app) => {
  const { controller, router } = app
  const auth = app.middleware.auth()

  router.get('/api/v1/health', controller.health.index)
  router.post('/api/v1/auth/login', controller.auth.login)
  router.post('/api/v1/auth/logout', auth, controller.auth.logout)
  router.get('/api/v1/dashboard/overview', auth, controller.dashboard.overview)
  router.get('/api/v1/system/employees', auth, controller.system.employees)
  router.post('/api/v1/system/employees', auth, controller.system.createEmployee)
  router.put('/api/v1/system/employees/:id', auth, controller.system.updateEmployee)
  router.patch('/api/v1/system/employees/:id/status', auth, controller.system.updateEmployeeStatus)
  router.post('/api/v1/system/employees/:id/reset-password', auth, controller.system.resetEmployeePassword)
  router.get('/api/v1/system/roles', auth, controller.system.roles)
  router.post('/api/v1/system/roles', auth, controller.system.createRole)
  router.put('/api/v1/system/roles/:id', auth, controller.system.updateRole)
  router.patch('/api/v1/system/roles/:id/status', auth, controller.system.updateRoleStatus)
}
