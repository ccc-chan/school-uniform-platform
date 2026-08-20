'use strict'

const genericCodes = ['view', 'create', 'edit', 'delete', 'export']

function genericCode(code) {
  if (code === 'view' || code.endsWith('.view') || code.includes('.field.')) {
    return 'view'
  }
  if (
    code === 'create' ||
    /\.(create|generate|batch_generate|bind)$/.test(code)
  ) {
    return 'create'
  }
  if (
    code === 'edit' ||
    /\.(edit|status|manage|approve|reject)$/.test(code)
  ) {
    return 'edit'
  }
  if (code === 'delete' || /\.(delete|void)$/.test(code)) {
    return 'delete'
  }
  if (code === 'export' || /\.(export|download)$/.test(code)) {
    return 'export'
  }
  return null
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [permissions] = await queryInterface.sequelize.query(
        'SELECT id, code FROM sys_permissions',
        { transaction },
      )
      const [rolePermissions] = await queryInterface.sequelize.query(
        'SELECT role_id, permission_id FROM sys_role_permissions',
        { transaction },
      )

      const permissionById = new Map(
        permissions.map((item) => [Number(item.id), item]),
      )
      const genericByCode = new Map(
        permissions
          .filter((item) => genericCodes.includes(item.code))
          .map((item) => [item.code, Number(item.id)]),
      )
      const grants = []
      const seen = new Set()

      for (const item of rolePermissions) {
        const code = genericCode(
          permissionById.get(Number(item.permission_id))?.code || '',
        )
        const permissionId = genericByCode.get(code)
        const key = `${item.role_id}:${permissionId}`

        if (permissionId && !seen.has(key)) {
          seen.add(key)
          grants.push({
            role_id: item.role_id,
            permission_id: permissionId,
            created_at: new Date(),
          })
        }
      }

      await queryInterface.bulkDelete(
        'sys_role_permissions',
        {},
        { transaction },
      )
      if (grants.length) {
        await queryInterface.bulkInsert(
          'sys_role_permissions',
          grants,
          { transaction },
        )
      }
      await queryInterface.bulkDelete(
        'sys_permissions',
        {
          code: permissions
            .map((item) => item.code)
            .filter((code) => !genericCodes.includes(code)),
        },
        { transaction },
      )
    })
  },

  async down() {
    throw new Error('简化后的历史细分权限无法无损恢复')
  },
}
