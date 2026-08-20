'use strict'

// 所有接口统一按上海时区输出日期时间，避免依赖服务器本地时区。
const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

module.exports = {
  // 无效或缺失日期统一显示为短横线，正常值格式化为 YYYY-MM-DD HH:mm:ss。
  formatDateTime(value) {
    if (!value) return '-'

    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    const parts = Object.fromEntries(
      dateTimeFormatter
        .formatToParts(date)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    )

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
  },

  // 归一化分页参数，并通过 maxPageSize 限制单次数据库查询规模。
  pagination(
    query = {},
    { defaultPageSize = 10, maxPageSize = 50 } = {},
  ) {
    const parsedPage = Number.parseInt(query.page, 10)
    const parsedPageSize = Number.parseInt(query.pageSize, 10)
    const page =
      Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : 1
    const pageSize =
      Number.isInteger(parsedPageSize) && parsedPageSize > 0
        ? Math.min(maxPageSize, parsedPageSize)
        : defaultPageSize

    return {
      page,
      pageSize,
      offset: (page - 1) * pageSize,
    }
  },
}
