<script setup lang="ts">
import QRCode from 'qrcode'
import { message } from 'ant-design-vue'
import {
  getQrLabelBatch,
  type QrLabelBatchPage,
} from '@/api/qrcodes'
import { buildQrTraceUrl } from '@/utils/qr-payload'

const props = defineProps<{
  batchNo: string
  total: number
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  download: []
}>()

const pageSize = 100
const loading = shallowRef(false)
const page = shallowRef(1)
const searchDraft = shallowRef('')
const keyword = shallowRef('')
const result = shallowRef<QrLabelBatchPage | null>(null)
const qrImages = shallowRef<Record<number, string>>({})
let loadSequence = 0

const rangeStart = computed(() =>
  result.value?.total ? (page.value - 1) * pageSize + 1 : 0,
)
const rangeEnd = computed(() =>
  Math.min(page.value * pageSize, result.value?.total || 0),
)

async function load() {
  if (!open.value || !props.batchNo) return
  const sequence = ++loadSequence
  loading.value = true
  try {
    const nextResult = await getQrLabelBatch(
      props.batchNo,
      page.value,
      pageSize,
      keyword.value,
    )
    const images = await Promise.all(
      nextResult.items.map(async (item) => [
        item.id,
        await QRCode.toDataURL(buildQrTraceUrl(item.code), {
          width: 180,
          margin: 2,
          errorCorrectionLevel: 'M',
        }),
      ] as const),
    )
    if (sequence !== loadSequence) return
    result.value = nextResult
    qrImages.value = Object.fromEntries(images)
  } catch (error) {
    if (sequence === loadSequence) {
      result.value = null
      qrImages.value = {}
      message.error(error instanceof Error ? error.message : '二维码列表加载失败')
    }
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

function search() {
  keyword.value = searchDraft.value.trim()
  if (page.value === 1) load()
  else page.value = 1
}

function handleSearchChange() {
  if (!searchDraft.value) search()
}

watch(
  [open, () => props.batchNo],
  ([visible]) => {
    if (!visible) return
    page.value = 1
    searchDraft.value = ''
    keyword.value = ''
    load()
  },
)

watch(page, () => {
  if (open.value) load()
})
</script>

<template>
  <a-modal
    v-model:open="open"
    :width="900"
    :footer="null"
    :mask-closable="false"
    wrap-class-name="qr-list-modal"
  >
    <template #title>
      <div class="qr-list-modal__title">
        <div>
          <strong>二维码列表</strong>
          <span>
            批次 {{ batchNo }} · 共 {{ total.toLocaleString('zh-CN') }} 个二维码
          </span>
        </div>
        <a-button type="primary" @click="emit('download')">
          打印下载全部
        </a-button>
      </div>
    </template>

    <div class="qr-list-modal__toolbar">
      <a-input
        v-model:value="searchDraft"
        allow-clear
        placeholder="搜索编码..."
        @press-enter="search"
        @change="handleSearchChange"
      />
    </div>

    <a-spin :spinning="loading">
      <div class="qr-list-modal__scroll">
        <div v-if="result?.items.length" class="qr-list-modal__grid">
          <article v-for="item in result.items" :key="item.id">
            <img
              v-if="qrImages[item.id]"
              :src="qrImages[item.id]"
              :alt="`二维码 ${item.code}`"
            />
            <div v-else class="qr-list-modal__placeholder" />
            <span>{{ item.code }}</span>
          </article>
        </div>
        <a-empty v-else class="qr-list-modal__empty" description="没有匹配的二维码" />
      </div>
    </a-spin>

    <footer class="qr-list-modal__footer">
      <span>
        显示 {{ rangeStart }}–{{ rangeEnd }} / 共 {{ result?.total || 0 }} 个
      </span>
      <a-pagination
        v-model:current="page"
        :page-size="pageSize"
        :total="result?.total || 0"
        :show-size-changer="false"
        size="small"
      />
    </footer>
  </a-modal>
</template>

<style scoped>
.qr-list-modal__title {
  display: flex;
  padding-right: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.qr-list-modal__title > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.qr-list-modal__title strong {
  color: #172033;
  font-size: 17px;
}
.qr-list-modal__title span {
  color: #64748b;
  font-size: 11px;
  font-weight: 400;
}
.qr-list-modal__title :deep(.ant-btn) {
  height: 36px;
  border-radius: 9px;
  font-size: 12px;
}
.qr-list-modal__toolbar {
  padding: 12px 0;
  border-bottom: 1px solid #edf1f6;
}
.qr-list-modal__toolbar :deep(.ant-input-affix-wrapper) {
  width: 288px;
  height: 36px;
  border-radius: 10px;
}
.qr-list-modal__scroll {
  height: min(552px, calc(100vh - 250px));
  min-height: 320px;
  overflow-y: auto;
  padding: 22px 4px 18px 0;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}
.qr-list-modal__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.qr-list-modal__grid article {
  display: flex;
  min-width: 0;
  min-height: 128px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #e4ebf3;
  border-radius: 12px;
  background: #fff;
  padding: 12px 8px 9px;
}
.qr-list-modal__grid img,
.qr-list-modal__placeholder {
  width: 80px;
  height: 80px;
  border: 1px solid #dbe5f0;
  border-radius: 9px;
  background: #f8fafc;
  object-fit: contain;
}
.qr-list-modal__grid span {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #334155;
  font-size: 9px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qr-list-modal__empty {
  padding-top: 100px;
}
.qr-list-modal__footer {
  display: flex;
  margin: 0 -24px -20px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #e7edf5;
  padding: 12px 24px 0;
  color: #64748b;
  font-size: 11px;
}
@media (max-width: 900px) {
  .qr-list-modal__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .qr-list-modal__title {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
  .qr-list-modal__toolbar :deep(.ant-input-affix-wrapper) {
    width: 100%;
  }
  .qr-list-modal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .qr-list-modal__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

