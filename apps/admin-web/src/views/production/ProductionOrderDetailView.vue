<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createProductionItem,
  getProductionItem,
  getProductionOptions,
  updateProductionItem,
  type ProductionInput,
  type ProductionOptions,
} from '@/api/production'
import ProductionOrderForm from '@/components/production/ProductionOrderForm.vue'

const route = useRoute()
const router = useRouter()
const loading = shallowRef(false)
const options = shallowRef<ProductionOptions>({
  products: [], employees: [], factories: [], orders: [], batches: [], processes: [],
})
const form = shallowRef<ProductionInput>({
  customerName: '',
  productId: undefined,
  quantity: 1,
  deliveryDate: '',
  status: 'pending',
  notes: '',
})
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => Number.isInteger(id.value) && id.value > 0)

async function load() {
  loading.value = true
  try {
    options.value = await getProductionOptions()
    if (!editing.value) return
    const item = await getProductionItem('orders', id.value)
    form.value = {
      customerName: item.customerName || '',
      productId: item.productId,
      quantity: item.quantity,
      deliveryDate: item.deliveryDate || '',
      status: item.status || 'pending',
      notes: item.notes || '',
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '订单数据加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!String(form.value.customerName || '').trim() || !form.value.productId || !form.value.quantity || !form.value.deliveryDate) {
    message.warning('请完整填写生产订单信息')
    return
  }
  loading.value = true
  try {
    if (editing.value) await updateProductionItem('orders', id.value, form.value)
    else await createProductionItem('orders', form.value)
    message.success(editing.value ? '生产订单已保存' : '生产订单创建成功')
    await router.replace('/production/orders')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '订单保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-300 space-y-4">
    <div>
      <h2 class="page-title">{{ editing ? '生产订单详情' : '新建生产订单' }}</h2>
      <p class="mb-0 mt-2 text-secondary">
        {{ editing ? '维护客户、产品、数量与交付计划' : '创建新的生产任务并进入排产流程' }}
      </p>
    </div>
    <a-skeleton v-if="loading && editing && !form.productId" active class="page-card" />
    <ProductionOrderForm
      v-else
      v-model="form"
      :options="options"
      :loading="loading"
      @submit="save"
      @cancel="router.push('/production/orders')"
    />
  </section>
</template>
