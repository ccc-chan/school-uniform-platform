import {
  computed,
  inject,
  provide,
  readonly,
  shallowRef,
  toValue,
  watch,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'
import {
  recordSchoolUniformInfoScan,
  type QrCodeType,
  type SchoolUniformInfo,
} from '@/api/school_uniform_info'

export function createSchoolUniformInfoViewModel(
  codeSource: MaybeRefOrGetter<string>,
) {
  const info = shallowRef<SchoolUniformInfo | null>(null)
  const loading = shallowRef(false)
  const errorMessage = shallowRef('')
  const code = computed(() => toValue(codeSource).trim())
  let requestId = 0

  const qrCodeType = computed<QrCodeType>(
    () => info.value?.qrCodeType || 'product',
  )

  const traceTypeLabel = computed(() => {
    if (qrCodeType.value === 'batch') return '一批一码'
    if (qrCodeType.value === 'school') return '一校一码'
    return '一品一码'
  })

  const statusLabel = computed(() => {
    if (!info.value) return ''
    if (info.value.status === 'activated') return '身份已激活'
    if (info.value.status === 'bound') return '首次查询已登记'
    return info.value.status || '状态未知'
  })

  function displayValue(value: string | null | undefined) {
    return value?.trim() || '暂无'
  }

  async function load() {
    const currentRequestId = ++requestId
    info.value = null
    errorMessage.value = ''

    if (!code.value) {
      errorMessage.value = '二维码编号不能为空'
      return
    }

    loading.value = true

    try {
      const result = await recordSchoolUniformInfoScan(code.value)
      if (currentRequestId === requestId) info.value = result
    } catch (error) {
      if (currentRequestId === requestId) {
        errorMessage.value =
          error instanceof Error ? error.message : '校服信息加载失败'
      }
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  watch(code, () => void load(), { immediate: true })

  return {
    code,
    info: readonly(info),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    qrCodeType,
    traceTypeLabel,
    statusLabel,
    displayValue,
    retry: load,
  }
}

export type SchoolUniformInfoViewModel = ReturnType<
  typeof createSchoolUniformInfoViewModel
>

const schoolUniformInfoKey: InjectionKey<SchoolUniformInfoViewModel> = Symbol(
  'school-uniform-info',
)

export function provideSchoolUniformInfoViewModel(
  viewModel: SchoolUniformInfoViewModel,
) {
  provide(schoolUniformInfoKey, viewModel)
}

export function useSchoolUniformInfoViewModel() {
  const viewModel = inject(schoolUniformInfoKey)

  if (!viewModel) {
    throw new Error('SchoolUniformInfoViewModel 尚未注入')
  }

  return viewModel
}
