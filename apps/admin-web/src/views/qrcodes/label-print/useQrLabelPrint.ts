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
export type PrintRangeMode = 'all' | 'custom'
export type CustomLabelLayerType = 'text' | 'image' | 'divider'
export type LabelVerticalAlignment = 'top' | 'middle' | 'bottom'
export type LabelImagePosition = 'before' | 'after'

export interface CustomLabelLayer {
  id: string
  type: CustomLabelLayerType
  name: string
  content: string
  imageDataUrl: string
  alignment: LabelAlignment
  verticalAlignment: LabelVerticalAlignment
  fontFamily: string
  fontSize: number
  fontScale: number
  letterSpacing: number
  lineHeight: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  textColor: string
  backgroundColor: string
  associatedImageDataUrl: string
  associatedImageName: string
  imagePosition: LabelImagePosition
  imageSize: number
  imageGap: number
  imageVerticalAlignment: LabelVerticalAlignment
  x: number
  y: number
  width: number
  height: number
}

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

export type LabelBlockKey =
  | 'company'
  | 'image'
  | 'identity'
  | 'qrcode'
  | 'code'

export interface LabelBlockPosition {
  x: number
  y: number
}

export type LabelLayout = Record<LabelBlockKey, LabelBlockPosition>

export function createDefaultLabelLayout(): LabelLayout {
  return {
    company: { x: 50, y: 35 },
    image: { x: 50, y: 20 },
    identity: { x: 50, y: 43 },
    qrcode: { x: 50, y: 57 },
    code: { x: 50, y: 78 },
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
  const selectedFields = ref<LabelField[]>(['qrcode'])
  const labelImageUrl = shallowRef('')
  const customLayers = ref<CustomLabelLayer[]>([])
  const labelStyle = ref<LabelStyleConfig>({ ...LABEL_STYLE_PRESETS[0].style })
  const labelLayout = ref<LabelLayout>(createDefaultLabelLayout())
  const loadingBatches = shallowRef(false)
  const loadingPreview = shallowRef(false)
  const printing = shallowRef(false)
  const printRangeMode = shallowRef<PrintRangeMode>('all')
  const printRangeStart = shallowRef(1)
  const printRangeEnd = shallowRef(1)
  const printCopies = shallowRef(1)
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
        width: Math.max(1, Number(customWidth.value) || 30),
        height: Math.max(1, Number(customHeight.value) || 90),
      }
    }
    const preset = LABEL_SIZE_PRESETS.find(
      (item) => item.key === selectedSizeKey.value,
    )
    return { width: preset?.width ?? 30, height: preset?.height ?? 90 }
  })
  const selectedLabelCount = computed(() => {
    const total = selectedBatch.value?.labelCount ?? 0
    if (printRangeMode.value === 'all') return total

    const start = Math.min(total, Math.max(1, printRangeStart.value))
    const end = Math.min(total, Math.max(start, printRangeEnd.value))
    return total ? end - start + 1 : 0
  })
  const printCount = computed(
    () => selectedLabelCount.value * Math.max(1, printCopies.value),
  )

  async function loadBatches(preferredBatchNo = '') {
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
        (item) => item.batchNo === preferredBatchNo,
      )
        ? preferredBatchNo
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
      printRangeStart.value = 1
      printRangeEnd.value = page.total
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
    const width = dimensions.value.width
    const height = dimensions.value.height

    pageStyle?.remove()
    pageStyle = document.createElement('style')
    pageStyle.dataset.qrLabelPage = 'true'
    pageStyle.textContent = `
      @page {
        size: ${width}mm ${height}mm;
        margin: 0;
      }

      @media print {
        #qr-label-print-sheet {
          width: ${width}mm !important;
        }

        .qr-label-print-page {
          width: ${width}mm !important;
          height: ${height}mm !important;
        }
      }
    `
    document.head.append(pageStyle)
  }

  function selectPrintItems(items: QrLabelItem[], testOnly: boolean) {
    if (testOnly) return items.slice(0, 1)
    if (printRangeMode.value === 'all') return items

    const start = Math.max(1, printRangeStart.value)
    const end = Math.min(items.length, Math.max(start, printRangeEnd.value))
    return items.slice(start - 1, end)
  }

  function repeatPrintItems(items: QrLabelItem[], copies: number) {
    return Array.from({ length: Math.max(1, copies) }, () => items).flat()
  }

  async function print(testOnly = false) {
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
      const rangedLabels = selectPrintItems(labels, testOnly)
      if (!rangedLabels.length) {
        throw new Error('当前打印范围内没有可用标签')
      }
      const printableLabels = repeatPrintItems(
        rangedLabels,
        testOnly ? 1 : printCopies.value,
      )
      printItems.value = await createPrintableLabels(printableLabels)
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
    labelImageUrl,
    customLayers,
    labelStyle,
    labelLayout,
    dimensions,
    loadingBatches,
    loadingPreview,
    printing,
    printRangeMode,
    printRangeStart,
    printRangeEnd,
    printCopies,
    printCount,
    printItems,
    loadBatches,
    selectBatch,
    print,
  }
}
