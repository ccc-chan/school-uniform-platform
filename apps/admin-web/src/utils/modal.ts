import Modal from 'ant-design-vue/es/modal'
import type { ModalFuncProps } from 'ant-design-vue/es/modal'

export function confirmAction(options: ModalFuncProps) {
  return Modal.confirm({
    okText: '确定',
    cancelText: '取消',
    ...options,
  })
}

export function confirmDisable(target: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmAction({
      title: '确认停用',
      content: `确定停用${target}吗？`,
      okText: '确认停用',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}
