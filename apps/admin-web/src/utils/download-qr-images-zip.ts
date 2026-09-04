import QRCode from 'qrcode'
import { getQrLabelBatch, type QrLabelItem } from '@/api/qrcodes'
import { buildQrTraceUrl } from '@/utils/qr-payload'

const PAGE_SIZE = 500
const IMAGE_BATCH_SIZE = 40
const QR_IMAGE_WIDTH = 600
const ZIP_MIME_TYPE = 'application/zip'
const textEncoder = new TextEncoder()

interface ZipEntry {
  name: string
  data: Uint8Array
}

const crc32Table = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value =
      (value & 1) !== 0
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
  }
  return value >>> 0
})

function concatenateBytes(chunks: readonly Uint8Array[]) {
  const result = new Uint8Array(
    chunks.reduce((total, chunk) => total + chunk.byteLength, 0),
  )
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }

  return result
}

function calculateCrc32(data: Uint8Array) {
  let crc = 0xffffffff

  for (const byte of data) {
    crc = crc32Table[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function getDosTimestamp(date = new Date()) {
  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    date:
      (((Math.max(1980, date.getFullYear()) - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  }
}

function createZip(entries: readonly ZipEntry[]) {
  if (entries.length > 0xffff) {
    throw new Error('二维码数量超过单个 ZIP 文件支持的上限')
  }

  const localParts: Uint8Array[] = []
  const directoryParts: Uint8Array[] = []
  const timestamp = getDosTimestamp()
  let localOffset = 0

  for (const entry of entries) {
    const name = textEncoder.encode(entry.name)
    const crc = calculateCrc32(entry.data)

    const localHeader = new Uint8Array(30)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, timestamp.time, true)
    localView.setUint16(12, timestamp.date, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, entry.data.byteLength, true)
    localView.setUint32(22, entry.data.byteLength, true)
    localView.setUint16(26, name.byteLength, true)
    localView.setUint16(28, 0, true)
    localParts.push(localHeader, name, entry.data)

    const directoryHeader = new Uint8Array(46)
    const directoryView = new DataView(directoryHeader.buffer)
    directoryView.setUint32(0, 0x02014b50, true)
    directoryView.setUint16(4, 20, true)
    directoryView.setUint16(6, 20, true)
    directoryView.setUint16(8, 0x0800, true)
    directoryView.setUint16(10, 0, true)
    directoryView.setUint16(12, timestamp.time, true)
    directoryView.setUint16(14, timestamp.date, true)
    directoryView.setUint32(16, crc, true)
    directoryView.setUint32(20, entry.data.byteLength, true)
    directoryView.setUint32(24, entry.data.byteLength, true)
    directoryView.setUint16(28, name.byteLength, true)
    directoryView.setUint16(30, 0, true)
    directoryView.setUint16(32, 0, true)
    directoryView.setUint16(34, 0, true)
    directoryView.setUint16(36, 0, true)
    directoryView.setUint32(38, 0, true)
    directoryView.setUint32(42, localOffset, true)
    directoryParts.push(directoryHeader, name)

    localOffset +=
      localHeader.byteLength + name.byteLength + entry.data.byteLength
  }

  const localData = concatenateBytes(localParts)
  const directory = concatenateBytes(directoryParts)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)

  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, entries.length, true)
  endView.setUint16(10, entries.length, true)
  endView.setUint32(12, directory.byteLength, true)
  endView.setUint32(16, localData.byteLength, true)
  endView.setUint16(20, 0, true)

  return concatenateBytes([localData, directory, end])
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')

  return sanitized || 'qrcode'
}

async function loadAllQrItems(batchNo: string) {
  const items: QrLabelItem[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (items.length < total) {
    const result = await getQrLabelBatch(batchNo, page, PAGE_SIZE)
    total = result.total
    items.push(...result.items)

    if (!result.items.length) break
    page += 1
  }

  return items
}

async function generateQrEntry(item: QrLabelItem, index: number) {
  const dataUrl = await QRCode.toDataURL(buildQrTraceUrl(item.code), {
    width: QR_IMAGE_WIDTH,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
  const response = await fetch(dataUrl)
  const data = new Uint8Array(await response.arrayBuffer())

  return {
    name: `${String(index + 1).padStart(6, '0')}_${sanitizeFilename(
      item.code,
    )}.png`,
    data,
  }
}

function downloadZip(data: Uint8Array, filename: string) {
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
  const url = URL.createObjectURL(
    new Blob([buffer], { type: ZIP_MIME_TYPE }),
  )
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadQrImagesZip(batchNo: string) {
  const items = await loadAllQrItems(batchNo)

  if (!items.length) {
    throw new Error('该批次没有可下载的二维码')
  }

  const entries: ZipEntry[] = []

  for (let start = 0; start < items.length; start += IMAGE_BATCH_SIZE) {
    const chunk = items.slice(start, start + IMAGE_BATCH_SIZE)
    entries.push(
      ...(await Promise.all(
        chunk.map((item, index) => generateQrEntry(item, start + index)),
      )),
    )
  }

  downloadZip(
    createZip(entries),
    `${sanitizeFilename(batchNo)}_二维码图片.zip`,
  )

  return items.length
}
