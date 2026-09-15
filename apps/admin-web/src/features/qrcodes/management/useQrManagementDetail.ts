import { computed, onBeforeUnmount, shallowRef, watch, type Ref } from 'vue'
import QRCode from 'qrcode'
import message from 'ant-design-vue/es/message'
import { getQrDetail, getQrScans, setQrDisabled } from '@/api/qr-management'
import type { QrManagementDetail, QrScanData } from '@/api/qr-management'
import { buildQrTraceUrl } from '@/utils/qr-payload'
import { confirmAction } from '@/utils/modal'

export function useQrManagementDetail(id: Readonly<Ref<number | null>>, changed: () => void) {
  const detail = shallowRef<QrManagementDetail | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  const qrImage = shallowRef('')
  const qrError = shallowRef('')
  const busy = shallowRef(false)
  const activeTab = shallowRef('detail')
  const scanPage = shallowRef(1)
  const scanData = shallowRef<QrScanData | null>(null)
  const scanLoading = shallowRef(false)
  const scanError = shallowRef('')
  const scanRetry = shallowRef(0)
  let controller: AbortController | undefined
  let disposed = false
  let printFrame: HTMLIFrameElement | null = null
  let printTimer: ReturnType<typeof setTimeout> | undefined

  function clearPrint() {
    if (printTimer) clearTimeout(printTimer)
    printFrame?.remove()
    printFrame = null
  }
  async function load() {
    controller?.abort()
    const current = new AbortController()
    controller = current
    detail.value = null
    qrImage.value = ''
    error.value = ''
    qrError.value = ''
    if (!id.value) return
    loading.value = true
    try {
      const result = await getQrDetail(id.value, current.signal)
      if (current.signal.aborted) return
      detail.value = result
      try {
        const dataUrl = await QRCode.toDataURL(buildQrTraceUrl(result.code), { width: 256, margin: 2, errorCorrectionLevel: 'M' })
        if (!current.signal.aborted) qrImage.value = dataUrl
      } catch (cause) {
        if (!current.signal.aborted) qrError.value = cause instanceof Error ? cause.message : '二维码图片加载失败'
      }
    } catch (cause) {
      if (!current.signal.aborted) error.value = cause instanceof Error ? cause.message : '详情加载失败'
    } finally {
      if (controller === current) loading.value = false
    }
  }
  watch(id, () => { scanPage.value = 1; void load() }, { immediate: true })
  watch([id, activeTab, scanPage, scanRetry], async ([qrId, tab], _old, onCleanup) => {
    scanData.value = null
    scanError.value = ''
    scanLoading.value = false
    if (!qrId || tab !== 'records') return
    const current = new AbortController()
    onCleanup(() => current.abort())
    scanLoading.value = true
    try {
      const result = await getQrScans(qrId, scanPage.value, current.signal)
      if (!current.signal.aborted) scanData.value = result
    } catch (cause) {
      if (!current.signal.aborted) scanError.value = cause instanceof Error ? cause.message : '扫码记录加载失败'
    } finally {
      if (!current.signal.aborted) scanLoading.value = false
    }
  })

  function toggleAvailability() {
    const item = detail.value
    if (!item || busy.value || item.qrStatus === 'voided') return
    confirmAction({
      title: item.disabled ? '恢复二维码' : '停用二维码',
      content: item.disabled ? `恢复 ${item.code} 后可继续扫码查询。` : `停用 ${item.code} 后扫码不可用，已有绑定和扫码记录会保留，可随时恢复。`,
      okText: item.disabled ? '恢复' : '停用',
      okType: item.disabled ? 'primary' : 'danger',
      async onOk() {
        if (disposed) return
        busy.value = true
        try {
          await setQrDisabled(item.id, !item.disabled, item.disabled)
          if (disposed) return
          message.success(item.disabled ? '二维码已恢复' : '二维码已停用')
          changed()
          await load()
        } catch (cause) {
          message.error(cause instanceof Error ? cause.message : '状态更新失败')
        } finally {
          busy.value = false
        }
      },
    })
  }

  async function printLabel() {
    if (!detail.value || !qrImage.value || busy.value) return
    busy.value = true
    try {
      // 打印前重新确认状态，防止使用已经停用的旧详情。
      const latest = await getQrDetail(detail.value.id)
      if (disposed) return
      detail.value = latest
      if (latest.disabled || latest.qrStatus === 'voided') {
        changed()
        return void message.warning('该二维码已停用或作废，不能打印')
      }
      clearPrint()
      const frame = document.createElement('iframe')
      frame.title = '二维码标签打印'
      frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0'
      document.body.append(frame)
      printFrame = frame
      const doc = frame.contentDocument
      const printWindow = frame.contentWindow
      if (!doc || !printWindow) throw new Error('无法创建打印预览')
      doc.open()
      doc.write('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>二维码标签</title></head><body></body></html>')
      doc.close()
      const style = doc.createElement('style')
      style.textContent = '@page{size:60mm 80mm;margin:4mm}body{margin:0;text-align:center;font:12px sans-serif;color:#111}img{display:block;width:42mm;height:42mm;margin:2mm auto}p{margin:2mm 0;overflow-wrap:anywhere}strong{font-size:13px}'
      doc.head.append(style)
      const label = doc.createElement('strong')
      label.textContent = latest.productName || '校服二维码'
      const image = doc.createElement('img')
      image.src = qrImage.value
      image.alt = latest.code
      const code = doc.createElement('p')
      code.textContent = latest.code
      const product = doc.createElement('p')
      product.textContent = `${latest.productCode || '—'} / ${latest.productSizes?.join('、').toUpperCase() || '—'}`
      doc.body.append(label, image, code, product)
      await image.decode()
      if (disposed) return
      printWindow.addEventListener('afterprint', clearPrint, { once: true })
      printTimer = setTimeout(clearPrint, 60000)
      printWindow.focus()
      printWindow.print()
    } catch (cause) {
      clearPrint()
      message.error(cause instanceof Error ? cause.message : '标签打印失败')
    } finally {
      busy.value = false
    }
  }

  const sections = computed(() => {
    const item = detail.value
    if (!item) return []
    const genders: Record<string, string> = { male: '男', female: '女', unknown: '未说明' }
    return [
      { title: '校服信息', fields: [
        ['品牌', item.brandName], ['学校', item.schoolName], ['产品', item.productName],
        ['款式', item.style], ['尺码（产品配置）', item.productSizes?.join('、').toUpperCase()],
        ['颜色', item.color], ['生产批次', item.productionBatch], ['生产日期', item.productionDate],
        ['生产工厂', item.factoryName], ['检测报告', item.hasQualityReport ? '已上传' : '未上传'],
      ] },
      { title: '学生信息', fields: [
        ['姓名', item.studentName], ['性别', genders[item.studentGender || '']],
        ['年级', item.grade], ['班级', item.className], ['学号', item.studentNo],
      ] },
      { title: '家长信息', fields: [
        ['家长', item.parentName], ['关系', item.parentRelation], ['手机号', item.phoneMasked],
      ] },
      { title: '二维码数据', fields: [
        ['生成时间', item.generatedAt], ['绑定时间', item.studentBoundAt],
        ['扫码次数', String(item.scanCount)], ['首次扫码', item.firstScannedAt], ['最后扫码', item.lastScannedAt],
      ] },
    ] as Array<{ title: string; fields: Array<[string, string | null | undefined]> }>
  })
  onBeforeUnmount(() => { disposed = true; controller?.abort(); clearPrint() })
  return { detail, loading, error, qrImage, qrError, busy, activeTab, scanPage, scanData, scanLoading, scanError, scanRetry, sections, load, toggleAvailability, printLabel }
}
