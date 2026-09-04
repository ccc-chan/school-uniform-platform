<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createProductBatchStep,
  deleteProductBatchStep,
  getProductDetail,
  type ProductDetail,
  type ProductProductionStepInput,
} from '@/api/products'
import { generateProductionBatchQrCodes } from '@/api/qrcodes'
import {
  createQuickQualityReport,
  deleteQualityReport,
  getQualityReportBlob,
  type QuickQualityReportCreate,
} from '@/api/quality'
import ProductBatchCreateModal from '@/components/products/ProductBatchCreateModal.vue'
import ProductBatchRail from '@/components/products/ProductBatchRail.vue'
import ProductProductionStepModal from '@/components/products/ProductProductionStepModal.vue'
import ProductProductionTimeline from '@/components/products/ProductProductionTimeline.vue'
import ProductQrListModal from '@/components/products/ProductQrListModal.vue'
import ProductQrPanel from '@/components/products/ProductQrPanel.vue'
import ProductQualityPanel from '@/components/products/ProductQualityPanel.vue'
import ProductQualityUploadModal from '@/components/products/ProductQualityUploadModal.vue'
import { useAuthStore } from '@/stores/auth'
import { downloadQrImagesZip } from '@/utils/download-qr-images-zip'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = shallowRef(false)
const detail = shallowRef<ProductDetail | null>(null)
const selectedBatchId = shallowRef<number | null>(null)
const batchEditorOpen = shallowRef(false)
const stepModalOpen = shallowRef(false)
const qrListOpen = shallowRef(false)
const qualityUploadOpen = shallowRef(false)
const stepSubmitting = shallowRef(false)
const qualitySubmitting = shallowRef(false)
const qrGenerating = shallowRef(false)
const qrDownloading = shallowRef(false)
const deletingStepId = shallowRef<number | null>(null)
const deletingQualityReportId = shallowRef<number | null>(null)
const id = computed(() => Number(route.params.id || 0))
const selectedBatch = computed(() =>
  detail.value?.batches.find((item) => item.id === selectedBatchId.value) || null,
)

const batchStatuses: Record<string, { label: string; color: string }> = {
  planned: { label: '计划中', color: 'orange' },
  in_progress: { label: '生产中', color: 'blue' },
  paused: { label: '已暂停', color: 'red' },
  completed: { label: '已完成', color: 'green' },
}

const selectedStatus = computed(() =>
  batchStatuses[selectedBatch.value?.status || ''] || {
    label: '状态未展示',
    color: 'default',
  },
)

const qrTypeLabels = {
  product: '一品一码',
  batch: '一批一码',
  school: '一校一码',
} as const

const productQrTypeLabel = computed(() => {
  const type = detail.value?.product.qrCodeType
  return type ? qrTypeLabels[type] : '二维码类型未设置'
})

const qualityStatus = computed(() =>
  detail.value?.qualityReports.length
    ? { label: '质检通过', color: 'green' }
    : { label: '质检不通过', color: 'red' },
)

async function load(preferredBatchId: number | null = selectedBatchId.value) {
  loading.value = true
  try {
    detail.value = await getProductDetail(id.value)
    selectedBatchId.value = detail.value.batches.some(
      (item) => item.id === preferredBatchId,
    )
      ? preferredBatchId
      : detail.value.batches[0]?.id || null
  } catch (error) {
    message.error(error instanceof Error ? error.message : '产品详情加载失败')
  } finally {
    loading.value = false
  }
}

async function handleBatchCreated(batchId: number) {
  await load(batchId)
}

async function createStep(value: ProductProductionStepInput) {
  if (!selectedBatch.value) return
  const batchId = selectedBatch.value.id
  stepSubmitting.value = true
  try {
    await createProductBatchStep(batchId, value)
    message.success('生产环节添加成功')
    stepModalOpen.value = false
    await load(batchId)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '生产环节添加失败')
  } finally {
    stepSubmitting.value = false
  }
}

async function deleteStep(stepId: number) {
  if (!selectedBatch.value) return
  const batchId = selectedBatch.value.id
  deletingStepId.value = stepId
  try {
    await deleteProductBatchStep(batchId, stepId)
    message.success('生产环节删除成功')
    await load(batchId)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '生产环节删除失败')
  } finally {
    deletingStepId.value = null
  }
}

async function generateCurrentBatchQrCodes() {
  if (!selectedBatch.value) return

  const batchId = selectedBatch.value.id
  qrGenerating.value = true

  try {
    const result = await generateProductionBatchQrCodes(batchId)
    message.success(
      `已按${qrTypeLabels[result.qrCodeType]}生成 ${result.quantity.toLocaleString(
        'zh-CN',
      )} 个二维码`,
    )
    await load(batchId)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '二维码生成失败')
  } finally {
    qrGenerating.value = false
  }
}

async function downloadCurrentBatchQrImages() {
  if (!selectedBatch.value || qrDownloading.value) return

  const batchNo = selectedBatch.value.batchNo
  qrDownloading.value = true

  try {
    const count = await downloadQrImagesZip(batchNo)
    message.success(`已下载 ${count.toLocaleString('zh-CN')} 张二维码图片`)
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '二维码图片下载失败',
    )
  } finally {
    qrDownloading.value = false
  }
}

function openLabels(action: 'preview' | 'print' = 'preview') {
  if (!selectedBatch.value) return
  router.push({
    path: '/qrcodes/label-print',
    query: {
      batchNo: selectedBatch.value.batchNo,
      action,
      source: 'product-detail',
    },
  })
}

function openQualityUpload() {
  qualityUploadOpen.value = true
}

async function submitQuickQualityReport(value: QuickQualityReportCreate) {
  const batchId = selectedBatch.value?.id || null
  qualitySubmitting.value = true
  try {
    await createQuickQualityReport(value)
    message.success('质检报告上传成功')
    qualityUploadOpen.value = false
    await load(batchId)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '质检报告上传失败')
  } finally {
    qualitySubmitting.value = false
  }
}

async function previewQualityReport(reportId: number) {
  try {
    const blob = await getQualityReportBlob(reportId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测报告预览失败')
  }
}

async function deleteQuality(reportId: number) {
  const batchId = selectedBatch.value?.id || null
  deletingQualityReportId.value = reportId
  try {
    await deleteQualityReport(reportId)
    message.success('质检报告删除成功')
    await load(batchId)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '质检报告删除失败')
  } finally {
    deletingQualityReportId.value = null
  }
}

watch(id, () => load(null), { immediate: true })
</script>

<template>
  <a-spin :spinning="loading">
    <section v-if="detail" class="product-detail">
      <ProductBatchRail
        :product="detail.product"
        :batches="detail.batches"
        :selected-id="selectedBatchId"
        :can-manage="auth.hasPermission('production.batch.manage')"
        @back="router.push('/products')"
        @select="selectedBatchId = $event"
        @create="batchEditorOpen = true"
      />

      <main class="product-detail__main">
        <div v-if="selectedBatch" class="product-detail__workspace">
          <header class="product-detail__header">
            <div>
              <div class="product-detail__title-row">
                <h2>批次 {{ selectedBatch.batchNo }}</h2>
                <a-tag :color="qualityStatus.color">
                  {{ qualityStatus.label }}
                </a-tag>
                <a-tag :color="selectedStatus.color">{{ selectedStatus.label }}</a-tag>
              </div>
              <p>
                {{ productQrTypeLabel }}
                · {{ selectedBatch.quantity?.toLocaleString('zh-CN') || '-' }} 件
                · {{ selectedBatch.productionDate || '-' }}
              </p>
            </div>
            <a-space>
              <a-button
                v-if="
                  auth.hasPermission('qrcode.generate') &&
                  auth.hasPermission('qrcode.bind')
                "
                type="primary"
                :loading="qrGenerating"
                :disabled="selectedBatch.qrTotal > 0"
                @click="generateCurrentBatchQrCodes"
              >
                {{ selectedBatch.qrTotal > 0 ? '二维码已生成' : '生成二维码' }}
              </a-button>
              <a-button
                v-if="auth.hasPermission('product.edit')"
                @click="router.push(`/products/${detail.product.id}/edit`)"
              >
                编辑
              </a-button>
              <a-button
                v-if="auth.hasPermission('qrcode.view')"
                @click="openLabels('preview')"
              >
                打印标签
              </a-button>
            </a-space>
          </header>

          <ProductQrPanel
            :batch="selectedBatch"
            :can-view="detail.access.qrcode"
            :can-print="auth.hasPermission('qrcode.view')"
            :downloading="qrDownloading"
            @preview="qrListOpen = true"
            @download="downloadCurrentBatchQrImages"
          />

          <div class="product-detail__support-grid">
            <ProductQualityPanel
              :reports="detail.qualityReports"
              :can-view="detail.access.quality"
              :can-preview="auth.hasPermission('quality.report.download')"
              :can-upload="auth.hasPermission('quality.report.create')"
              :can-delete="auth.hasPermission('quality.report.create')"
              :deleting-id="deletingQualityReportId"
              @preview="previewQualityReport"
              @upload="openQualityUpload"
              @remove="deleteQuality"
            />

            <ProductProductionTimeline
              :steps="selectedBatch.productionSteps"
              :can-view="detail.access.production"
              :can-manage="auth.hasPermission('production.record.manage')"
              :deleting-id="deletingStepId"
              @add="stepModalOpen = true"
              @remove="deleteStep"
            />
          </div>
        </div>

        <a-empty
          v-else
          class="product-detail__empty"
          description="该产品暂无生产批次"
        />
      </main>

      <ProductBatchCreateModal
        v-model:open="batchEditorOpen"
        :product-id="detail.product.id"
        @created="handleBatchCreated"
      />

      <ProductProductionStepModal
        v-if="selectedBatch"
        v-model:open="stepModalOpen"
        :batch-no="selectedBatch.batchNo"
        :product-name="detail.product.name || '-'"
        :submitting="stepSubmitting"
        @submit="createStep"
      />

      <ProductQualityUploadModal
        v-if="selectedBatch"
        v-model:open="qualityUploadOpen"
        :product-id="detail.product.id"
        :product-name="detail.product.name || '-'"
        :batch-no="selectedBatch.batchNo"
        :submitting="qualitySubmitting"
        @submit="submitQuickQualityReport"
      />

      <ProductQrListModal
        v-if="selectedBatch"
        v-model:open="qrListOpen"
        :batch-no="selectedBatch.batchNo"
        :total="selectedBatch.qrTotal"
        :downloading="qrDownloading"
        @download="downloadCurrentBatchQrImages"
      />
    </section>
  </a-spin>
</template>

<style scoped>
.product-detail {
  display: grid;
  min-height: calc(100vh - 112px);
  grid-template-columns: 320px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #dfe7f1;
  border-radius: 14px;
  background: #fff;
}
.product-detail__main {
  min-width: 0;
  background: #f7f9fc;
  padding: 24px 20px 32px;
}
.product-detail__workspace {
  display: flex;
  width: 100%;
  max-width: 1040px;
  flex-direction: column;
  gap: 16px;
}
.product-detail__header {
  display: flex;
  min-height: 58px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.product-detail__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.product-detail__title-row h2 {
  margin: 0;
  color: #172033;
  font-size: 18px;
  line-height: 28px;
}
.product-detail__title-row :deep(.ant-tag) {
  margin-inline-end: 0;
  border: 0;
  border-radius: 5px;
  font-size: 10px;
}
.product-detail__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}
.product-detail__header :deep(.ant-btn) {
  height: 36px;
  border-radius: 9px;
  padding-inline: 18px;
}
.product-detail__support-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}
.product-detail__empty {
  max-width: 1040px;
  padding: 72px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}
@media (max-width: 1080px) {
  .product-detail__support-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .product-detail {
    grid-template-columns: 1fr;
  }
  .product-detail__main {
    padding: 20px;
  }
  .product-detail__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
