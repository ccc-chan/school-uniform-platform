import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import message from 'ant-design-vue/es/message'
import { searchQrManagement, saveQrStudent } from '@/api/qr-management'
import type { QrManagementData, QrManagementFilters, QrManagementItem, QrStudentInput } from '@/api/qr-management'

const emptyFilters = (): QrManagementFilters => ({ code: '', studentName: '', phone: '', schoolName: '', status: '' })

export function useQrManagement() {
  const filters = reactive(emptyFilters())
  let applied = emptyFilters()
  const data = shallowRef<QrManagementData | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  const saving = shallowRef(false)
  const editing = shallowRef<QrManagementItem | null>(null)
  const page = shallowRef(1)
  const pageSize = shallowRef(10)
  let controller: AbortController | undefined

  async function load(nextPage = page.value, nextSize = pageSize.value) {
    controller?.abort()
    const requestController = new AbortController()
    controller = requestController
    loading.value = true
    error.value = ''
    try {
      const result = await searchQrManagement(applied, nextPage, nextSize, requestController.signal)
      if (requestController.signal.aborted) return
      data.value = result
      page.value = result.page
      pageSize.value = result.pageSize
    } catch (cause) {
      if (!requestController.signal.aborted) error.value = cause instanceof Error ? cause.message : '二维码数据加载失败'
    } finally {
      if (controller === requestController) loading.value = false
    }
  }
  function search() {
    applied = { ...filters }
    return load(1)
  }
  function reset() {
    Object.assign(filters, emptyFilters())
    applied = emptyFilters()
    return load(1)
  }
  async function save(value: QrStudentInput) {
    if (!editing.value || saving.value) return
    saving.value = true
    try {
      await saveQrStudent(editing.value.id, value)
      editing.value = null
      message.success('学生绑定已保存')
      // 保存可能改变筛选结果，回到首页避免停留在空的末页。
      await load(1)
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : '保存失败')
    } finally {
      saving.value = false
    }
  }
  const metrics = computed(() => {
    const statistics = data.value?.statistics
    return [
      { label: '二维码总数', value: statistics?.total, hint: '全部二维码' },
      { label: '学生已绑定', value: statistics?.bound, hint: '已录入学生信息的有效二维码' },
      { label: '已激活', value: statistics?.activated, hint: '已产生扫码记录的二维码' },
      { label: '今日扫码', value: statistics?.todayScans, hint: '今日 00:00 起 · 北京时间' },
    ]
  })
  onMounted(() => void load())
  onBeforeUnmount(() => controller?.abort())
  return { filters, data, loading, error, saving, editing, page, pageSize, metrics, load, search, reset, save }
}
