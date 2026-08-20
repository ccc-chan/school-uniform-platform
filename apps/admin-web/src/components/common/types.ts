import type { TableColumnType } from 'ant-design-vue'

// 配置驱动型公共表单和表格组件使用的共享类型。
export interface ConfigOption {
  label: string
  value: string | number
  disabled?: boolean
}

export type ConfigFormFieldType =
  | 'input'
  | 'number'
  | 'date'
  | 'password'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'

export interface ConfigFormField {
  key: string
  name?: string
  itemClass?: string
  label: string
  type: ConfigFormFieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: ConfigOption[]
  span?: 1 | 2
  componentProps?: Record<string, unknown>
}

export interface ConfigTableColumn extends TableColumnType {
  key: string
}
