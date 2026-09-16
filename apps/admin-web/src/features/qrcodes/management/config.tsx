import type { ConfigFormField } from '@/components/common/types'
import { pcaTextArr } from 'element-china-area-data'
import { qrManagementStatusMap } from '@/api/qr-management'

export const statuses = Object.entries(qrManagementStatusMap).map(([value, item]) => ({
  value,
  label: item.label,
}))

export const provinces = pcaTextArr.map((p) => ({ label: p.label, value: p.label }))

export function getCities(province?: string) {
  if (!province) return []
  const p = pcaTextArr.find((p) => p.label === province)
  return p?.children ? p.children.map((c) => ({ label: c.label, value: c.label })) : []
}

export function getDistricts(province?: string, city?: string) {
  if (!city) return []
  const p = pcaTextArr.find((p) => p.label === province)
  const c = p?.children?.find((c) => c.label === city)
  return c?.children ? c.children.map((d) => ({ label: d.label, value: d.label })) : []
}

export function getFilterFields(
  filters: { province?: string; city?: string },
  onSearch: () => void
): ConfigFormField[] {
  return [
    {
      key: 'code',
      label: '二维码ID',
      type: 'input',
      placeholder: '输入二维码ID，支持模糊查询',
      itemClass: 'qr-filters__text',
      componentProps: { allowClear: true, maxlength: 100, onPressEnter: onSearch },
    },
    {
      key: 'studentName',
      label: '学生姓名',
      type: 'input',
      placeholder: '输入学生姓名，支持模糊查询',
      itemClass: 'qr-filters__text',
      componentProps: { allowClear: true, maxlength: 100, onPressEnter: onSearch },
    },
    {
      key: 'phone',
      label: '手机号',
      type: 'input',
      placeholder: '输入手机号或部分数字',
      itemClass: 'qr-filters__text',
      componentProps: { allowClear: true, maxlength: 11, inputmode: 'numeric', onPressEnter: onSearch },
    },
    {
      key: 'schoolName',
      label: '学校',
      type: 'input',
      placeholder: '输入学校名称',
      itemClass: 'qr-filters__text',
      componentProps: { allowClear: true, maxlength: 100, onPressEnter: onSearch },
    },
    {
      key: 'province',
      label: '省份',
      type: 'select',
      placeholder: '请选择省份',
      options: provinces,
      itemClass: 'qr-filters__select',
      componentProps: { allowClear: true, showSearch: true },
    },
    {
      key: 'city',
      label: '城市',
      type: 'select',
      placeholder: '请选择城市',
      options: getCities(filters.province),
      disabled: !filters.province,
      itemClass: 'qr-filters__select',
      componentProps: { allowClear: true, showSearch: true },
    },
    {
      key: 'district',
      label: '区县',
      type: 'select',
      placeholder: '请选择区县',
      options: getDistricts(filters.province, filters.city),
      disabled: !filters.city,
      itemClass: 'qr-filters__select',
      componentProps: { allowClear: true, showSearch: true },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部状态',
      options: statuses,
      itemClass: 'qr-filters__select',
      componentProps: { allowClear: true },
    },
  ]
}

export const tableColumns = [
  { title: '二维码ID', key: 'code', dataIndex: 'code', width: 200 },
  { title: '校服产品', key: 'product', dataIndex: 'product', width: 150 },
  { title: '学校', key: 'schoolName', dataIndex: 'schoolName', width: 130 },
  { title: '学生', key: 'student', dataIndex: 'student', width: 110 },
  { title: '家长', key: 'parent', dataIndex: 'parent', width: 130 },
  { title: '扫码次数', key: 'scanCount', dataIndex: 'scanCount', width: 90 },
  { title: '状态', key: 'status', dataIndex: 'status', width: 110 },
  { title: '操作', key: 'actions', dataIndex: 'actions', width: 190, fixed: 'right' as const },
]