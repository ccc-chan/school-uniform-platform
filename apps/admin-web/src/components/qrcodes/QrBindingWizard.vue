<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  bindQrCodes,
  type QrBatchOption,
  type QrBindingResult,
} from '@/api/qrcodes'

const props = withDefaults(defineProps<{
  batches: readonly QrBatchOption[]
  loadingBatches: boolean
  initialProductId?: number
  initialProductionBatch?: string
}>(), {
  initialProductId: 0,
  initialProductionBatch: '',
})
const emit = defineEmits<{
  cancel: []
  success: [value: QrBindingResult]
}>()

const current = shallowRef(0)
const submitting = shallowRef(false)
const form = reactive({
  generationBatchId: 0,
  quantity: 1,
  productSku: '',
  productionBatch: '',
})
const steps = [
  { title: '选择批次' },
  { title: '绑定规则' },
  { title: '确认绑定' },
]
const availableBatches = computed(() =>
  props.initialProductId
    ? props.batches.filter((item) => item.productId === props.initialProductId)
    : props.batches,
)
const batchOptions = computed(() =>
  availableBatches.value.map((item) => ({
    label: `${item.batchNo} · ${item.productName} · 剩余 ${item.available}`,
    value: item.id,
  })),
)
const selectedBatch = computed(() =>
  availableBatches.value.find((item) => item.id === form.generationBatchId),
)

watch(
  () => props.initialProductionBatch,
  (value) => {
    if (value) form.productionBatch = value
  },
  { immediate: true },
)

watch(selectedBatch, (batch) => {
  if (!batch) return
  form.quantity = Math.min(Math.max(form.quantity, 1), batch.available)
  if (!form.productSku) form.productSku = `${batch.productCode}-`
})

function next() {
  if (current.value === 0 && !selectedBatch.value) {
    message.warning('请选择待绑定的二维码批次')
    return
  }
  if (current.value === 1) {
    const available = selectedBatch.value?.available || 0
    if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > available) {
      message.warning(`绑定数量须为 1 至 ${available} 的整数`)
      return
    }
    if (!form.productSku.trim()) {
      message.warning('请填写产品 SKU')
      return
    }
    if (!form.productionBatch.trim()) {
      message.warning('请填写生产批次')
      return
    }
  }
  current.value += 1
}

function selectBatch(value: unknown) {
  form.generationBatchId = Number(value || 0)
}

async function submit() {
  if (!selectedBatch.value) return
  submitting.value = true
  try {
    const result = await bindQrCodes({
      ...form,
      productSku: form.productSku.trim(),
      productionBatch: form.productionBatch.trim(),
    })
    message.success(`已绑定 ${result.quantity.toLocaleString('zh-CN')} 个二维码`)
    emit('success', result)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '二维码绑定失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page-card qr-wizard">
    <a-steps :current="current" :items="steps" size="small" />

    <div class="qr-wizard__body">
      <div v-if="current === 0" class="mx-auto max-w-210">
        <h3 class="qr-wizard__title">选择二维码生成批次</h3>
        <a-select
          :value="form.generationBatchId || undefined"
          :options="batchOptions"
          :loading="loadingBatches"
          show-search
          option-filter-prop="label"
          class="w-full"
          placeholder="请选择仍有未绑定二维码的批次"
          @update:value="selectBatch"
        />

        <article v-if="selectedBatch" class="batch-summary mt-5">
          <div class="batch-summary__header">
            <div>
              <div class="text-sm text-slate-500">生成批次</div>
              <div class="mt-1 font-700 text-slate-900">{{ selectedBatch.batchNo }}</div>
            </div>
            <a-tag color="green">可绑定 {{ selectedBatch.available.toLocaleString('zh-CN') }} 个</a-tag>
          </div>
          <a-descriptions class="mt-5" :column="2" size="small">
            <a-descriptions-item label="产品">{{ selectedBatch.productName }}</a-descriptions-item>
            <a-descriptions-item label="产品编号">{{ selectedBatch.productCode }}</a-descriptions-item>
            <a-descriptions-item label="款式">{{ selectedBatch.style || '-' }}</a-descriptions-item>
            <a-descriptions-item label="生成总量">
              {{ selectedBatch.quantity.toLocaleString('zh-CN') }} 个
            </a-descriptions-item>
          </a-descriptions>
        </article>
      </div>

      <a-form
        v-else-if="current === 1"
        :model="form"
        layout="vertical"
        class="mx-auto max-w-210"
      >
        <h3 class="qr-wizard__title">设置绑定规则</h3>
        <a-form-item label="绑定方式">
          <a-radio-group value="quantity">
            <a-radio value="quantity">按数量绑定</a-radio>
            <a-radio value="range" disabled>按编号范围绑定</a-radio>
          </a-radio-group>
        </a-form-item>
        <div class="grid grid-cols-1 gap-x-5 md:grid-cols-2">
          <a-form-item label="生产批次" required>
            <a-input
              v-model:value="form.productionBatch"
              :maxlength="100"
              :disabled="Boolean(initialProductionBatch)"
              placeholder="例如：MO20260717001"
            />
          </a-form-item>
          <a-form-item label="产品 SKU" required>
            <a-input
              v-model:value="form.productSku"
              :maxlength="100"
              placeholder="例如：SU2026001-160"
            />
          </a-form-item>
        </div>
        <a-form-item
          label="绑定数量"
          required
          :extra="`当前批次最多可绑定 ${selectedBatch?.available || 0} 个`"
        >
          <a-input-number
            v-model:value="form.quantity"
            :min="1"
            :max="selectedBatch?.available || 1"
            :precision="0"
            class="w-full"
          />
        </a-form-item>
      </a-form>

      <div v-else class="mx-auto max-w-210">
        <h3 class="qr-wizard__title">确认绑定信息</h3>
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="二维码批次">{{ selectedBatch?.batchNo }}</a-descriptions-item>
          <a-descriptions-item label="产品">
            {{ selectedBatch?.productName }}（{{ selectedBatch?.productCode }}）
          </a-descriptions-item>
          <a-descriptions-item label="生产批次">{{ form.productionBatch }}</a-descriptions-item>
          <a-descriptions-item label="产品 SKU">{{ form.productSku }}</a-descriptions-item>
          <a-descriptions-item label="绑定数量">
            {{ form.quantity.toLocaleString('zh-CN') }} 个
          </a-descriptions-item>
        </a-descriptions>
        <a-alert
          class="mt-4"
          type="warning"
          show-icon
          message="系统将按编号顺序绑定当前批次中最早生成的未绑定二维码。"
        />
      </div>
    </div>

    <footer class="qr-wizard__footer">
      <a-button @click="current === 0 ? emit('cancel') : current--">
        {{ current === 0 ? '取消' : '上一步' }}
      </a-button>
      <a-button v-if="current < 2" type="primary" @click="next">下一步</a-button>
      <a-button v-else type="primary" :loading="submitting" @click="submit">
        确认绑定
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

.batch-summary {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 20px;
}

.batch-summary__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
