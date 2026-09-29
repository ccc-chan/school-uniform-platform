'use strict'

function letterSuffix(value) {
  let current = Number(value)
  let result = ''
  while (current > 0) {
    current -= 1
    result = String.fromCharCode(65 + (current % 26)) + result
    current = Math.floor(current / 26)
  }
  return result || 'A'
}

module.exports = {
  async up(queryInterface) {
    const [companies] = await queryInterface.sequelize.query(
      'SELECT id, code FROM companies ORDER BY id ASC',
    )
    const usedCodes = new Set(
      companies
        .map((company) => String(company.code || '').toUpperCase())
        .filter((code) => /^[A-Z]{2,32}$/.test(code)),
    )

    for (const company of companies) {
      const currentCode = String(company.code || '').toUpperCase()
      if (/^[A-Z]{2,32}$/.test(currentCode)) continue

      let code = `COMPANY${letterSuffix(company.id)}`
      while (usedCodes.has(code)) code += 'X'
      usedCodes.add(code)
      await queryInterface.bulkUpdate(
        'companies',
        { code },
        { id: company.id },
      )
    }
  },

  async down() {
    // 数据编码迁移不自动还原，避免覆盖迁移后由用户设置的新编码。
  },
}
