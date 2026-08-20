<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createProductBatchStep,
  deleteProductBatchStep,
  getProductDetail,
  type ProductDetail,
} from '@/api/products'
import { getQualityReportBlob } from '@/api/quality'
import ProductBatchCreateModal from '@/components/products/ProductBatchCreateModal.vue'
import ProductBatchRail from '@/components/products/ProductBatchRail.vue'
import ProductProductionStepModal from '@/components/products/ProductProductionStepModal.vue'
import ProductProductionTimeline from '@/components/products/ProductProductionTimeline.vue'
import ProductQrPanel from '@/components/products/ProductQrPanel.vue'
import ProductQualityPanel from '@/components/products/ProductQualityPanel.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = shallowRef(false)
const detail = shallowRef<ProductDetail | null>(null)
const selectedBatchId = shallowRef<number | null>(null)
const batchEditorOpen = shallowRef(false)
const stepModalOpen = shallowRef(false)
const stepSubmitting = shallowRef(false)
const deletingStepId = shallowRef<number | null>(null)
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

async function createStep(content: string) {
  if (!selectedBatch.value) return
  const batchId = selectedBatch.value.id
  stepSubmitting.value = true
  try {
    await createProductBatchStep(batchId, content)
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

function openLabels() {
  if (!selectedBatch.value) return
  router.push({
    path: '/qrcodes/label-print',
    query: { batchNo: selectedBatch.value.batchNo },
  })
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
                <a-tag :color="selectedStatus.color">{{ selectedStatus.label }}</a-tag>
              </div>
              <p>
                {{ selectedBatch.quantity?.toLocaleString('zh-CN') || '-' }} 件
                · {{ detail.product.code || '产品编码未展示' }}
                · {{ selectedBatch.productionDate || '-' }}
              </p>
            </div>
            <a-space>
              <a-button
                v-if="auth.hasPermission('product.edit')"
                @click="router.push(`/products/${detail.product.id}/edit`)"
              >
                编辑
              </a-button>
              <a-button
                v-if="auth.hasPermission('qrcode.view')"
                type="primary"
                @click="openLabels"
              >
                打印标签
              </a-button>
            </a-space>
          </header>

          <ProductQrPanel
            :batch="selectedBatch"
            :can-view="detail.access.qrcode"
            :can-print="auth.hasPermission('qrcode.view')"
            @labels="openLabels"
          />

          <ProductQualityPanel
            :reports="detail.qualityReports"
            :can-view="detail.access.quality"
            :can-preview="auth.hasPermission('quality.report.download')"
            @preview="previewQualityReport"
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
        :submitting="stepSubmitting"
        @submit="createStep"
      />
    </section>
  </a-spin>
</template>

<style scoped>
.product-detail{display:grid;min-height:calc(100vh - 112px);grid-template-columns:300px minmax(0,1fr);overflow:hidden;border:1px solid #dfe7f1;border-radius:14px;background:#fff}.product-detail__main{min-width:0;background:#f7f9fc;padding:28px 24px}.product-detail__workspace{display:flex;max-width:980px;flex-direction:column;gap:18px}.product-detail__header{display:flex;align-items:center;justify-content:space-between;gap:24px}.product-detail__title-row{display:flex;align-items:center;gap:10px}.product-detail__title-row h2{margin:0;color:#172033;font-size:18px}.product-detail__title-row :deep(.ant-tag){margin-inline-end:0;border:0;border-radius:5px;font-size:10px}.product-detail__header p{margin:6px 0 0;color:#64748b;font-size:12px}.product-detail__header :deep(.ant-btn){height:36px;border-radius:9px}.product-detail__empty{max-width:980px;padding:72px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}@media(max-width:900px){.product-detail{grid-template-columns:1fr}.product-detail__main{padding:20px}.product-detail__header{align-items:flex-start;flex-direction:column}}
</style>
