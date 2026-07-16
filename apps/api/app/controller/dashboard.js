'use strict'

const { Controller } = require('egg')

class DashboardController extends Controller {
  async overview() {
    this.ctx.body = {
      code: 200,
      message: 'success',
      data: {
        metrics: [
          ['今日扫码次数', 1268, '+12.5%', '较昨日', '#2563EB', '#EAF2FF', '⌁'],
          ['二维码总数', 258692, '+8.3%', '较昨日', '#14B8A6', '#E7F8F5', '⌗'],
          ['已绑定数量', 198520, '76.7%', '绑定率', '#F97316', '#FFF1E8', '⌛'],
          ['产品总数', 128, '+2', '较昨日', '#8B5CF6', '#F1ECFF', '▣'],
          ['检测报告总数', 346, '+4', '较昨日', '#3B82F6', '#EAF2FF', '♧'],
        ].map(([label, value, trend, trendLabel, color, softColor, symbol]) => ({
          label,
          value,
          trend,
          trendLabel,
          color,
          softColor,
          symbol,
        })),
        scanPoints: [
          { date: '06-13', value: 1050 },
          { date: '06-14', value: 1120 },
          { date: '06-15', value: 1500 },
          { date: '06-16', value: 1400 },
          { date: '06-17', value: 1090 },
          { date: '06-18', value: 1510 },
          { date: '06-19', value: 1268 },
        ],
        qrStatuses: [
          { name: '未绑定', value: 25672, percent: 9.9, color: '#60A5FA' },
          { name: '已绑定', value: 198520, percent: 76.7, color: '#2563EB' },
          { name: '已出厂', value: 23546, percent: 9.1, color: '#A78BFA' },
          { name: '已作废', value: 6954, percent: 2.7, color: '#F97316' },
          { name: '异常', value: 4000, percent: 1.6, color: '#14B8A6' },
        ],
        activities: [
          {
            id: 1,
            time: '2026-07-15 14:23:45',
            operator: '张三',
            action: '生成二维码',
            detail: '生成 5,000 个二维码',
            status: '成功',
          },
          {
            id: 2,
            time: '2026-07-15 13:15:22',
            operator: '李四',
            action: '绑定二维码',
            detail: '绑定批次：20260715001',
            status: '成功',
          },
          {
            id: 3,
            time: '2026-07-15 10:45:11',
            operator: '王五',
            action: '上传检测报告',
            detail: '检测报告：GT20260715001',
            status: '处理中',
          },
          {
            id: 4,
            time: '2026-07-14 16:33:09',
            operator: '赵六',
            action: '新增产品',
            detail: '产品名称：夏季运动套装',
            status: '成功',
          },
          {
            id: 5,
            time: '2026-07-14 15:22:31',
            operator: '孙七',
            action: '打印标签',
            detail: '打印数量：2,000 个',
            status: '成功',
          },
        ],
        rankings: [
          { name: '夏季运动套装', scans: 8562 },
          { name: '秋季校服套装', scans: 6245 },
          { name: '冬季冲锋衣套装', scans: 4682 },
          { name: '春季礼服套装', scans: 3265 },
          { name: '夏季 T 恤短裤套装', scans: 2156 },
        ],
      },
    }
  }
}

module.exports = DashboardController
