import type { LabelDimensions } from './useQrLabelPrint'

const WORD_DPI = 96
const CAPTURE_DPI = 300
const EMUS_PER_MILLIMETER = 36_000
const TWIPS_PER_MILLIMETER = 1_440 / 25.4
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const textEncoder = new TextEncoder()

interface ExportQrLabelsToWordOptions {
  artworks: readonly HTMLElement[]
  dimensions: LabelDimensions
  filename: string
}

interface ZipEntry {
  name: string
  data: Uint8Array
}

const crc32Table = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0
      ? 0xedb88320 ^ (value >>> 1)
      : value >>> 1
  }
  return value >>> 0
})

function millimetersToPixels(value: number, dpi = WORD_DPI) {
  return (value / 25.4) * dpi
}

function millimetersToEmus(value: number) {
  return Math.round(value * EMUS_PER_MILLIMETER)
}

function millimetersToTwips(value: number) {
  return Math.round(value * TWIPS_PER_MILLIMETER)
}

function encode(value: string) {
  return textEncoder.encode(value)
}

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
      ((Math.floor(date.getSeconds() / 2)) & 0x1f),
    date:
      (((Math.max(1980, date.getFullYear()) - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  }
}

function createZip(entries: readonly ZipEntry[]) {
  const localParts: Uint8Array[] = []
  const directoryParts: Uint8Array[] = []
  const timestamp = getDosTimestamp()
  let localOffset = 0

  for (const entry of entries) {
    const name = encode(entry.name)
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

    localOffset += localHeader.byteLength + name.byteLength + entry.data.byteLength
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

function collectDocumentStyles() {
  const rules: string[] = []
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(styleSheet.cssRules)) {
        rules.push(rule.cssText)
      }
    } catch {
      continue
    }
  }
  return rules.join('\n')
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('标签图片渲染失败'))
    image.src = source
  })
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('标签图片转换失败'))
    }, 'image/png')
  })
}

async function renderArtworkToPng(
  artwork: HTMLElement,
  dimensions: LabelDimensions,
  documentStyles: string,
) {
  const bounds = artwork.getBoundingClientRect()
  if (!bounds.width || !bounds.height) {
    throw new Error('标签尺寸无效，无法生成 Word 文档')
  }

  const clone = artwork.cloneNode(true) as HTMLElement
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  clone.style.width = `${bounds.width}px`
  clone.style.height = `${bounds.height}px`

  const wrapper = document.createElement('div')
  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  wrapper.style.width = `${bounds.width}px`
  wrapper.style.height = `${bounds.height}px`
  const style = document.createElement('style')
  style.textContent = documentStyles
  wrapper.append(style, clone)

  const captureWidth = Math.max(
    1,
    Math.round(millimetersToPixels(dimensions.width, CAPTURE_DPI)),
  )
  const captureHeight = Math.max(
    1,
    Math.round(millimetersToPixels(dimensions.height, CAPTURE_DPI)),
  )
  const content = new XMLSerializer().serializeToString(wrapper)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${captureWidth}" height="${captureHeight}" viewBox="0 0 ${bounds.width} ${bounds.height}"><foreignObject x="0" y="0" width="${bounds.width}" height="${bounds.height}">${content}</foreignObject></svg>`
  const svgUrl = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
  )

  try {
    const image = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = captureWidth
    canvas.height = captureHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持标签图片转换')
    context.drawImage(image, 0, 0, captureWidth, captureHeight)
    return new Uint8Array(await (await canvasToPng(canvas)).arrayBuffer())
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function createDrawingXml(index: number, dimensions: LabelDimensions) {
  const relationshipId = `rId${index + 1}`
  const width = millimetersToEmus(dimensions.width)
  const height = millimetersToEmus(dimensions.height)
  const pageBreak = index > 0 ? '<w:pageBreakBefore/>' : ''

  return `<w:p><w:pPr>${pageBreak}<w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${index + 1}" behindDoc="0" locked="1" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${width}" cy="${height}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${index + 1}" name="Label ${index + 1}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="label-${index + 1}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>`
}

function createDocx(
  images: readonly Uint8Array[],
  dimensions: LabelDimensions,
) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${images.map((_, index) => createDrawingXml(index, dimensions)).join('')}<w:sectPr><w:pgSz w:w="${millimetersToTwips(dimensions.width)}" w:h="${millimetersToTwips(dimensions.height)}"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`
  const relationships = images
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/label-${index + 1}.png"/>`,
    )
    .join('')

  return createZip([
    {
      name: '[Content_Types].xml',
      data: encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
    },
    {
      name: '_rels/.rels',
      data: encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
    },
    { name: 'word/document.xml', data: encode(documentXml) },
    {
      name: 'word/_rels/document.xml.rels',
      data: encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`,
      ),
    },
    ...images.map((image, index) => ({
      name: `word/media/label-${index + 1}.png`,
      data: image,
    })),
  ])
}

function downloadDocx(data: Uint8Array, filename: string) {
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([buffer], { type: DOCX_MIME_TYPE }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportQrLabelsToWord({
  artworks,
  dimensions,
  filename,
}: ExportQrLabelsToWordOptions) {
  if (!artworks.length) throw new Error('没有可导出的标签')

  await document.fonts?.ready
  const documentStyles = collectDocumentStyles()
  const images: Uint8Array[] = []
  for (const artwork of artworks) {
    images.push(
      await renderArtworkToPng(artwork, dimensions, documentStyles),
    )
  }

  downloadDocx(createDocx(images, dimensions), filename)
}
