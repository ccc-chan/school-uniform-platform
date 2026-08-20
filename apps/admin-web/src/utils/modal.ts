import { Modal } from 'ant-design-vue'
import type { ModalFuncProps } from 'ant-design-vue'

export function confirmAction(options: ModalFuncProps) {
  return Modal.confirm({
    okText: '确定',
    cancelText: '取消',
    ...options,
  })
}
