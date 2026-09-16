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
  requestStudentBinding,
  StudentBindingError,
  type StudentBinding,
  type StudentBindingInput,
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
  const studentBinding = shallowRef<StudentBinding | null>(null)
  const bindingLoading = shallowRef(false)
  const bindingLoaded = shallowRef(false)
  const bindingError = shallowRef('')
  const bindingSaving = shallowRef(false)
  const bindingSubmitError = shallowRef('')
  let bindingRequestId = 0

  async function loadStudentBinding() {
    if (!info.value || qrCodeType.value !== 'product') return
    const currentId = ++bindingRequestId
    const currentCode = code.value
    bindingLoading.value = true
    bindingError.value = ''
    try {
      const result = await requestStudentBinding(currentCode)
      if (currentId !== bindingRequestId || currentCode !== code.value) return
      studentBinding.value = result
      bindingLoaded.value = true
    } catch (error) {
      if (currentId === bindingRequestId && currentCode === code.value) {
        bindingError.value = error instanceof Error ? error.message : '学生信息加载失败'
      }
    } finally {
      if (currentId === bindingRequestId) bindingLoading.value = false
    }
  }

  async function bindStudent(value: StudentBindingInput): Promise<boolean> {
    if (bindingSaving.value || !bindingLoaded.value || bindingError.value || studentBinding.value) return false
    const currentCode = code.value
    const currentId = ++bindingRequestId
    bindingSaving.value = true
    bindingSubmitError.value = ''
    try {
      const result = await requestStudentBinding(currentCode, value)
      if (currentId !== bindingRequestId || currentCode !== code.value) return false
      if (!result) throw new Error('绑定结果为空，请重新查询学生信息')
      studentBinding.value = result
      return true
    } catch (error) {
      if (currentId !== bindingRequestId || currentCode !== code.value) return false
      bindingSubmitError.value = error instanceof Error ? error.message : '绑定失败，请重试'
      if (error instanceof StudentBindingError && error.status === 409) {
        await loadStudentBinding()
      }
      return false
    } finally {
      if (currentCode === code.value) bindingSaving.value = false
    }
  }

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
    ++bindingRequestId
    studentBinding.value = null
    bindingLoaded.value = false
    bindingLoading.value = false
    bindingSaving.value = false
    bindingError.value = ''
    bindingSubmitError.value = ''

    if (!code.value) {
      errorMessage.value = '二维码编号不能为空'
      return
    }

    loading.value = true

    try {
      const result = await recordSchoolUniformInfoScan(code.value)
      if (currentRequestId === requestId) {
        info.value = result
        void loadStudentBinding()
      }
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
    studentBinding: readonly(studentBinding),
    bindingLoading: readonly(bindingLoading),
    bindingLoaded: readonly(bindingLoaded),
    bindingError: readonly(bindingError),
    bindingSaving: readonly(bindingSaving),
    bindingSubmitError: readonly(bindingSubmitError),
    loadStudentBinding,
    bindStudent,
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
