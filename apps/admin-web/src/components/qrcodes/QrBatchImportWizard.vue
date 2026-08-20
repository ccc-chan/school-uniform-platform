<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  batchGenerateQrCodes,
  type QrBatchGenerationInput,
  type QrGenerationResult,
} from '@/api/qrcodes'
import ConfigTable from '@/components/common/ConfigTable.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const emit = defineEmits<{
  cancel: []
  success: [value: QrGenerationResult[]]
}>()

const current = shallowRef(0)
const parsing = shallowRef(false)
const submitting = shallowRef(false)
const fileName = shallowRef('')
const rows = shallowRef<QrBatchGenerationInput[]>([])
const steps = [
  { title: '上传文件' },
  { title: '生成数据' },
  { title: '确认生成' },
]
const columns: ConfigTableColumn[] = [
  { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 160 },
  { title: '生成数量', dataIndex: 'quantity', key: 'quantity', width: 120 },
  { title: '编号前缀', dataIndex: 'prefix', key: 'prefix', width: 120 },
  { title: '备注', dataIndex: 'notes', key: 'notes', width: 220 },
]
const totalQuantity = computed(() =>
  rows.value.reduce((sum, item) => sum + item.quantity, 0),
)

async function createWorkbook() {
  const { default: ExcelJS } = await import('exceljs')
  return new ExcelJS.Workbook()
}

async function downloadTemplate() {
  const workbook = await createWorkbook()
  const sheet = workbook.addWorksheet('二维码批量生成模板')
  sheet.columns = [
    { header: '产品编号', key: 'productCode', width: 20 },
    { header: '生成数量', key: 'quantity', width: 16 },
    { header: '编号前缀', key: 'prefix', width: 16 },
    { header: '备注', key: 'notes', width: 32 },
  ]
  sheet.addRow({ productCode: 'SU2026001', quantity: 1000, prefix: 'SU', notes: '示例数据，请删除' })
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  }
  const content = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(
    new Blob([content as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = '二维码批量生成模板.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

async function parseFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    message.warning('请上传 .xlsx 格式文件')
    return
  }
  parsing.value = true
  try {
    const workbook = await createWorkbook()
    await workbook.xlsx.load((await file.arrayBuffer()) as never)
    const sheet = workbook.worksheets[0]
    if (!sheet) throw new Error('工作簿中没有可读取的工作表')
    const expected = ['产品编号', '生成数量', '编号前缀', '备注']
    const actual = expected.map((_, index) => sheet.getRow(1).getCell(index + 1).text.trim())
    if (expected.some((header, index) => actual[index] !== header)) {
      throw new Error(`表头必须为：${expected.join('、')}`)
    }
    const parsed: QrBatchGenerationInput[] = []
    for (let index = 2; index <= sheet.rowCount; index += 1) {
      const row = sheet.getRow(index)
      const productCode = row.getCell(1).text.trim().toUpperCase()
      const quantityText = row.getCell(2).text.trim()
      const prefix = row.getCell(3).text.trim().toUpperCase()
      const notes = row.getCell(4).text.trim()
      if (!productCode && !quantityText && !prefix && !notes) continue
      const quantity = Number(quantityText)
      if (!productCode) throw new Error(`第 ${index} 行缺少产品编号`)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
        throw new Error(`第 ${index} 行生成数量须为 1 至 100000 的整数`)
      }
      if (!/^[A-Z][A-Z0-9_-]{1,11}$/.test(prefix)) {
        throw new Error(`第 ${index} 行编号前缀格式不正确`)
      }
      parsed.push({ productCode, quantity, prefix, notes })
    }
    if (!parsed.length) throw new Error('文件中没有有效数据')
    if (parsed.length > 100) throw new Error('单次最多导入 100 行')
    if (parsed.reduce((sum, item) => sum + item.quantity, 0) > 200000) {
      throw new Error('单次批量生成总量不能超过 200000')
    }
    rows.value = parsed
    fileName.value = file.name
    current.value = 1
  } catch (error) {
    rows.value = []
    message.error(error instanceof Error ? error.message : 'Excel 文件解析失败')
  } finally {
    parsing.value = false
  }
}

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void parseFile(file)
  input.value = ''
}

async function submit() {
  submitting.value = true
  try {
    const result = await batchGenerateQrCodes(rows.value)
    message.success(`已创建 ${result.length} 个二维码批次`)
    emit('success', result)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '批量生成失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page-card qr-wizard">
    <a-steps :current="current" :items="steps" size="small" />

    <div class="qr-wizard__body">
      <div v-if="current === 0" class="mx-auto max-w-220">
        <label class="upload-zone" :class="{ 'upload-zone--loading': parsing }">
          <input
            class="hidden"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            :disabled="parsing"
            @change="handleFile"
          />
          <span class="upload-zone__icon">☁</span>
          <strong class="mt-4 text-base text-slate-800">
            {{ parsing ? '正在解析文件…' : '点击选择 Excel 文件上传' }}
          </strong>
          <span class="mt-2 text-sm text-slate-500">支持 .xlsx，最多 100 行</span>
        </label>
        <div class="mt-4 text-center">
          <a-button type="link" @click="downloadTemplate">下载导入模板</a-button>
        </div>
      </div>

      <div v-else-if="current === 1">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="font-600 text-slate-900">{{ fileName }}</div>
            <div class="mt-1 text-sm text-slate-500">
              共 {{ rows.length }} 行，预计生成 {{ totalQuantity.toLocaleString('zh-CN') }} 个二维码
            </div>
          </div>
          <a-button @click="current = 0">重新上传</a-button>
        </div>
        <ConfigTable
          :columns="columns"
          :items="rows as unknown as Record<string, unknown>[]"
          :scroll-x="720"
          size="small"
        />
      </div>

      <div v-else class="mx-auto max-w-190">
        <h3 class="qr-wizard__title">确认批量生成</h3>
        <a-result
          status="info"
          title="即将批量创建二维码"
          :sub-title="`${rows.length} 个产品批次，共 ${totalQuantity.toLocaleString('zh-CN')} 个二维码`"
        />
        <a-alert
          type="warning"
          show-icon
          message="系统会先校验全部产品编号，任意一行失败时不会写入任何二维码。"
        />
      </div>
    </div>

    <footer class="qr-wizard__footer">
      <a-button @click="current === 0 ? emit('cancel') : current--">
        {{ current === 0 ? '取消' : '上一步' }}
      </a-button>
      <a-button v-if="current === 1" type="primary" @click="current = 2">下一步</a-button>
      <a-button v-if="current === 2" type="primary" :loading="submitting" @click="submit">
        确认生成
      </a-button>
    </footer>
  </section>
</template>

<style scoped>
.qr-wizard {
  min-height: 560px;
}

.qr-wizard__body {
  min-height: 390px;
  padding: 42px 16px 28px;
}

.qr-wizard__title {
  margin: 0 0 22px;
  color: #0f172a;
  font-size: 16px;
}

.qr-wizard__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f1f5f9;
  padding-top: 18px;
}

.upload-zone {
  display: flex;
  min-height: 270px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #93c5fd;
  border-radius: 12px;
  background: #f8fbff;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-zone:hover,
.upload-zone--loading {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-zone__icon {
  display: flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(145deg, #60a5fa, #2563eb);
  font-size: 26px;
}
</style>
