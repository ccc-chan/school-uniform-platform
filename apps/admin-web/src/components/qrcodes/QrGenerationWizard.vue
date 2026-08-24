<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  generateQrCodes,
  type QrGenerationResult,
  type QrProductOption,
} from '@/api/qrcodes'

const props = withDefaults(defineProps<{
  products: readonly QrProductOption[]
  loadingProducts: boolean
  initialProductId?: number
  initialQuantity?: number
}>(), {
  initialProductId: 0,
  initialQuantity: 1000,
})
const emit = defineEmits<{
  cancel: []
  success: [value: QrGenerationResult]
}>()

const current = shallowRef(0)
const submitting = shallowRef(false)
const form = reactive({
  productId: props.initialProductId,
  quantity: props.initialQuantity,
  prefix: 'SU',
  notes: '',
})

const selectedProduct = computed(() =>
  props.products.find((item) => item.id === form.productId),
)
const productOptions = computed(() =>
  props.products.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  })),
)
const steps = [
  { title: '选择产品' },
  { title: '生成信息' },
  { title: '确认生成' },
]

function validateGeneration() {
  if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 100000) {
    message.warning('生成数量须为 1 至 100000 的整数')
    return false
  }
  form.prefix = form.prefix.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9_-]{1,11}$/.test(form.prefix)) {
    message.warning('编号前缀须为 2 至 12 位大写字母、数字、下划线或短横线')
    return false
  }
  return true
}

function next() {
  if (current.value === 0 && !selectedProduct.value) {
    message.warning('请先选择产品')
    return
  }
  if (current.value === 1 && !validateGeneration()) return
  current.value += 1
}

function selectProduct(value: unknown) {
  form.productId = Number(value || 0)
}

async function submit() {
  if (!selectedProduct.value || !validateGeneration()) return
  submitting.value = true
  try {
    const result = await generateQrCodes({ ...form })
    message.success(`已生成 ${result.quantity.toLocaleString('zh-CN')} 个二维码`)
    emit('success', result)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '二维码生成失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page-card qr-wizard">
    <a-steps :current="current" :items="steps" size="small" />

    <div class="qr-wizard__body">
      <div v-if="current === 0" class="mx-auto max-w-190">
        <h3 class="qr-wizard__title">选择产品</h3>
        <a-select
          :value="form.productId || undefined"
          :options="productOptions"
          :loading="loadingProducts"
          show-search
          option-filter-prop="label"
          class="w-full"
          placeholder="请选择需要生成二维码的产品"
          @update:value="selectProduct"
        />
        <article v-if="selectedProduct" class="product-summary mt-5">
          <div class="product-summary__visual">服</div>
          <div>
            <div class="text-base font-700 text-slate-900">
              {{ selectedProduct.name }}
            </div>
            <div class="mt-2 text-sm text-slate-500">
              产品编号：{{ selectedProduct.code }}
            </div>
            <div class="mt-1 text-sm text-slate-500">
              款式：{{ selectedProduct.style || '-' }} · 颜色：{{ selectedProduct.color || '-' }}
            </div>
          </div>
        </article>
      </div>

      <a-form
        v-else-if="current === 1"
        :model="form"
        layout="vertical"
        class="mx-auto max-w-190"
      >
        <h3 class="qr-wizard__title">填写生成信息</h3>
        <a-form-item label="生成数量" required>
          <a-input-number
            v-model:value="form.quantity"
            :min="1"
            :max="100000"
            :precision="0"
            class="w-full"
          />
        </a-form-item>
        <a-form-item label="二维码前缀" required extra="2–12 位，用于区分品牌或业务线">
          <a-input
            v-model:value="form.prefix"
            :maxlength="12"
            placeholder="例如：SU"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="form.notes"
            :rows="3"
            :maxlength="500"
            show-count
            placeholder="请输入本次生成说明（选填）"
          />
        </a-form-item>
      </a-form>

      <div v-else class="mx-auto max-w-190">
        <h3 class="qr-wizard__title">确认生成信息</h3>
        <a-descriptions bordered :column="1" size="small">
          <a-descriptions-item label="产品">
            {{ selectedProduct?.name }}（{{ selectedProduct?.code }}）
          </a-descriptions-item>
          <a-descriptions-item label="生成数量">
            {{ form.quantity.toLocaleString('zh-CN') }} 个
          </a-descriptions-item>
          <a-descriptions-item label="编号前缀">{{ form.prefix }}</a-descriptions-item>
          <a-descriptions-item label="编号规则">
            前缀 + 生成日期 + 批次号 + 六位序号
          </a-descriptions-item>
          <a-descriptions-item label="备注">{{ form.notes || '-' }}</a-descriptions-item>
        </a-descriptions>
        <a-alert
          class="mt-4"
          type="info"
          show-icon
          message="提交后系统将在一个事务中生成全部二维码，编号不会重复。"
        />
      </div>
    </div>

    <footer class="qr-wizard__footer">
      <a-button @click="current === 0 ? emit('cancel') : current--">
        {{ current === 0 ? '取消' : '上一步' }}
      </a-button>
      <a-button v-if="current < 2" type="primary" @click="next">下一步</a-button>
      <a-button v-else type="primary" :loading="submitting" @click="submit">
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

.product-summary {
  display: flex;
  align-items: center;
  gap: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 18px;
}

.product-summary__visual {
  display: flex;
  width: 72px;
  height: 72px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #2563eb;
  background: linear-gradient(145deg, #dbeafe, #eff6ff);
  font-size: 22px;
  font-weight: 700;
}
</style>
