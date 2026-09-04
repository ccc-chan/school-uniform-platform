// 集中维护后端状态值对应的中文标签和 Ant Design 标签颜色。
export interface StatusPresentation {
  label: string
  color: string
}

export type StatusPresentationMap = Readonly<
  Record<string, StatusPresentation>
>

export const ENABLED_STATUS_MAP: StatusPresentationMap = {
  enabled: { label: '启用', color: 'green' },
  disabled: { label: '停用', color: 'default' },
}

export const ACCOUNT_STATUS_MAP: StatusPresentationMap = {
  enabled: { label: '已启用', color: 'green' },
  disabled: { label: '已停用', color: 'default' },
}

export const QUALITY_REPORT_STATUS_MAP: StatusPresentationMap = {
  pending: { label: '待审核', color: 'orange' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
  expired: { label: '已过期', color: 'default' },
}


