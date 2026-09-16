import { computed, onBeforeUnmount, shallowRef } from 'vue'
import message from 'ant-design-vue/es/message'
import { searchQrManagement, saveQrStudent } from '@/api/qr-management'
import type {
  QrManagementData,
  QrManagementFilters,
  QrManagementItem,
  QrStudentInput,
} from '@/api/qr-management'
import { usePagedList } from '@/composables/usePagedList'

const emptyFilters = (): QrManagementFilters => ({
  code: '',
  studentName: '',
  phone: '',
  schoolName: '',
  province: '广东省',
  city: '',
  district: '',
  status: '',
})

export function useQrManagement() {
  const statistics = shallowRef<QrManagementData['statistics']>()
  const error = shallowRef('')
  const saving = shallowRef(false)
  const editing = shallowRef<QrManagementItem | null>(null)
  let controller: AbortController | undefined

  const list = usePagedList<QrManagementItem, QrManagementFilters>({
    createFilters: emptyFilters,
    fetchPage: async (params) => {
      controller?.abort()
      const requestController = new AbortController()
      controller = requestController
      error.value = ''

      try {
        const { page, pageSize, ...filters } = params
        const result = await searchQrManagement(
          filters,
          page,
          pageSize,
          requestController.signal,
        )
        if (requestController.signal.aborted) {
          // Return empty result to avoid errors, though the state update might be discarded
          return { items: [], total: 0 }
        }
        statistics.value = result.statistics
        return {
          items: result.items,
          total: result.total,
        }
      } catch (cause) {
        if (!requestController.signal.aborted) {
          error.value =
            cause instanceof Error ? cause.message : '二维码数据加载失败'
        }
        return { items: [], total: 0 }
      }
    },
  })

  // Load initially
  list.load()

  onBeforeUnmount(() => controller?.abort())

  async function save(value: QrStudentInput) {
    if (!editing.value || saving.value) return
    saving.value = true
    try {
      await saveQrStudent(editing.value.id, value)
      editing.value = null
      message.success('学生绑定已保存')
      await list.load()
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '保存失败')
    } finally {
      saving.value = false
    }
  }

  const metrics = computed(() => {
    const stats = statistics.value
    return [
      { label: '二维码总数', value: stats?.total, hint: '全部二维码' },
      {
        label: '学生已绑定',
        value: stats?.bound,
        hint: '已录入学生信息的有效二维码',
      },
      {
        label: '已激活',
        value: stats?.activated,
        hint: '已产生扫码记录的二维码',
      },
      {
        label: '今日扫码',
        value: stats?.todayScans,
        hint: '今日 00:00 起 · 北京时间',
      },
    ]
  })

  return {
    ...list,
    error,
    saving,
    editing,
    metrics,
    save,
  }
}
