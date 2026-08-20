import QRCode from 'qrcode'
import { computed, nextTick, onUnmounted, ref, shallowRef } from 'vue'
import {
  getQrLabelBatch,
  getQrLabelBatches,
  type QrLabelBatch,
  type QrLabelBatchPage,
  type QrLabelItem,
} from '@/api/qrcodes'
import { buildQrTraceUrl } from '@/utils/qr-payload'

export type LabelField =
  | 'company'
  | 'product'
  | 'batch'
  | 'material'
  | 'size'
  | 'qrcode'

export interface LabelDimensions {
  width: number
  height: number
}

export interface LabelSizePreset extends LabelDimensions {
  key: string
  label: string
  custom?: boolean
}

export type LabelAlignment = 'left' | 'center' | 'right'
export type LabelBorderStyle = 'solid' | 'dashed' | 'none'
export type LabelStylePresetKey = 'classic' | 'minimal' | 'brand'

export interface LabelStyleConfig {
  presetKey: LabelStylePresetKey
  alignment: LabelAlignment
  fontScale: number
  qrScale: number
  textColor: string
  accentColor: string
  backgroundColor: string
  borderStyle: LabelBorderStyle
}

export type LabelBlockKey = 'company' | 'identity' | 'qrcode'

export interface LabelBlockPosition {
  x: number
  y: number
}

export type LabelLayout = Record<LabelBlockKey, LabelBlockPosition>

export function createDefaultLabelLayout(): LabelLayout {
  return {
    company: { x: 50, y: 35 },
    identity: { x: 50, y: 43 },
    qrcode: { x: 50, y: 57 },
  }
}

export interface PrintableQrLabel extends QrLabelItem {
  qrDataUrl: string
}

export const LABEL_SIZE_PRESETS: readonly LabelSizePreset[] = [
  { key: '30x50', label: '3×5cm', width: 30, height: 50 },
  { key: '30x90', label: '3×9cm', width: 30, height: 90 },
  { key: '30x100', label: '3×10cm', width: 30, height: 100 },
  { key: '35x110', label: '3.5×11cm', width: 35, height: 110 },
  { key: '50x70', label: '5×7cm', width: 50, height: 70 },
  { key: 'a4', label: 'A4', width: 210, height: 297 },
  { key: 'custom', label: '自定义', width: 30, height: 90, custom: true },
]

export const LABEL_FIELDS: readonly { value: LabelField; label: string }[] = [
  { value: 'company', label: '公司名称' },
  { value: 'product', label: '产品名称' },
  { value: 'batch', label: '批次号' },
  { value: 'material', label: '款号/面料' },
  { value: 'size', label: '尺码' },
  { value: 'qrcode', label: '二维码' },
]

export const LABEL_STYLE_PRESETS: readonly {
  key: LabelStylePresetKey
  label: string
  description: string
  style: LabelStyleConfig
}[] = [
  {
    key: 'classic',
    label: '经典线框',
    description: '居中排版，适合常规吊牌',
    style: {
      presetKey: 'classic',
      alignment: 'center',
      fontScale: 100,
      qrScale: 100,
      textColor: '#172033',
      accentColor: '#15803d',
      backgroundColor: '#ffffff',
      borderStyle: 'solid',
    },
  },
  {
    key: 'minimal',
    label: '极简留白',
    description: '无边框、左对齐，信息更克制',
    style: {
      presetKey: 'minimal',
      alignment: 'left',
      fontScale: 105,
      qrScale: 92,
      textColor: '#111827',
      accentColor: '#2563eb',
      backgroundColor: '#ffffff',
      borderStyle: 'none',
    },
  },
  {
    key: 'brand',
    label: '品牌色带',
    description: '顶部强调色带，品牌识别更强',
    style: {
      presetKey: 'brand',
      alignment: 'center',
      fontScale: 100,
      qrScale: 105,
      textColor: '#172033',
      accentColor: '#2563eb',
      backgroundColor: '#f8fbff',
      borderStyle: 'solid',
    },
  },
]

const QR_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  margin: 4,
  width: 1024,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
}

function renderQrDataUrl(code: string) {
  return QRCode.toDataURL(buildQrTraceUrl(code), QR_OPTIONS)
}

export function useQrLabelPrint() {
  const batches = ref<QrLabelBatch[]>([])
  const batchPage = shallowRef<QrLabelBatchPage | null>(null)
  const previewQrUrl = shallowRef('')
  const selectedBatchNo = shallowRef('')
  const companyName = shallowRef('')
  const selectedSizeKey = shallowRef('30x90')
  const customWidth = shallowRef(30)
  const customHeight = shallowRef(90)
  const selectedFields = ref<LabelField[]>(LABEL_FIELDS.map((item) => item.value))
  const labelStyle = ref<LabelStyleConfig>({ ...LABEL_STYLE_PRESETS[0].style })
  const labelLayout = ref<LabelLayout>(createDefaultLabelLayout())
  const loadingBatches = shallowRef(false)
  const loadingPreview = shallowRef(false)
  const printing = shallowRef(false)
  const printItems = ref<PrintableQrLabel[]>([])
  let loadSequence = 0
  let pageStyle: HTMLStyleElement | null = null

  const selectedBatch = computed(() =>
    batches.value.find((item) => item.batchNo === selectedBatchNo.value) ?? null,
  )
  const previewItem = computed(() => batchPage.value?.items[0] ?? null)
  const dimensions = computed<LabelDimensions>(() => {
    if (selectedSizeKey.value === 'custom') {
      return {
        width: Math.max(25, Number(customWidth.value) || 30),
        height: Math.max(25, Number(customHeight.value) || 90),
      }
    }
    const preset = LABEL_SIZE_PRESETS.find(
      (item) => item.key === selectedSizeKey.value,
    )
    return { width: preset?.width ?? 30, height: preset?.height ?? 90 }
  })

  async function loadBatches() {
    loadingBatches.value = true
    try {
      batches.value = await getQrLabelBatches()
      if (!batches.value.length) {
        selectedBatchNo.value = ''
        batchPage.value = null
        previewQrUrl.value = ''
        return
      }
      const nextBatch = batches.value.some(
        (item) => item.batchNo === selectedBatchNo.value,
      )
        ? selectedBatchNo.value
        : batches.value[0].batchNo
      await selectBatch(nextBatch)
    } finally {
      loadingBatches.value = false
    }
  }

  async function selectBatch(batchNo: string) {
    selectedBatchNo.value = batchNo
    const sequence = ++loadSequence
    if (!batchNo) {
      batchPage.value = null
      previewQrUrl.value = ''
      return
    }

    loadingPreview.value = true
    try {
      const page = await getQrLabelBatch(batchNo, 1, 1)
      const qrUrl = page.items[0]
        ? await renderQrDataUrl(page.items[0].code)
        : ''
      if (sequence !== loadSequence) return
      batchPage.value = page
      previewQrUrl.value = qrUrl
    } catch (error) {
      if (sequence === loadSequence) {
        batchPage.value = null
        previewQrUrl.value = ''
      }
      throw error
    } finally {
      if (sequence === loadSequence) loadingPreview.value = false
    }
  }

  async function loadAllLabels(batchNo: string) {
    const firstPage = await getQrLabelBatch(batchNo, 1, 500)
    const items = [...firstPage.items]
    const pageCount = Math.ceil(firstPage.total / firstPage.pageSize)
    for (let page = 2; page <= pageCount; page += 1) {
      const result = await getQrLabelBatch(batchNo, page, 500)
      items.push(...result.items)
    }
    return items
  }

  async function createPrintableLabels(items: QrLabelItem[]) {
    const result: PrintableQrLabel[] = []
    const chunkSize = 24
    for (let start = 0; start < items.length; start += chunkSize) {
      const chunk = items.slice(start, start + chunkSize)
      const rendered = await Promise.all(
        chunk.map(async (item) => ({
          ...item,
          qrDataUrl: await renderQrDataUrl(item.code),
        })),
      )
      result.push(...rendered)
    }
    return result
  }

  function installPageStyle() {
    pageStyle?.remove()
    pageStyle = document.createElement('style')
    pageStyle.dataset.qrLabelPage = 'true'
    pageStyle.textContent = `@page { size: ${dimensions.value.width}mm ${dimensions.value.height}mm; margin: 0; }`
    document.head.append(pageStyle)
  }

  async function print() {
    if (!selectedBatchNo.value || !selectedBatch.value) {
      throw new Error('请选择需要打印的生产批次')
    }
    if (!selectedFields.value.includes('qrcode')) {
      throw new Error('追溯标签必须包含二维码')
    }
    if (
      selectedFields.value.includes('company') &&
      !companyName.value.trim()
    ) {
      throw new Error('请输入公司名称')
    }

    printing.value = true
    try {
      const labels = await loadAllLabels(selectedBatchNo.value)
      printItems.value = await createPrintableLabels(labels)
      installPageStyle()
      await nextTick()
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      window.print()
    } finally {
      printing.value = false
    }
  }

  onUnmounted(() => {
    pageStyle?.remove()
    printItems.value = []
  })

  return {
    batches,
    selectedBatch,
    previewItem,
    previewQrUrl,
    selectedBatchNo,
    companyName,
    selectedSizeKey,
    customWidth,
    customHeight,
    selectedFields,
    labelStyle,
    labelLayout,
    dimensions,
    loadingBatches,
    loadingPreview,
    printing,
    printItems,
    loadBatches,
    selectBatch,
    print,
  }
}
