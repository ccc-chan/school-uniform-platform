<script setup lang="ts">
import type { Product, ProductProductionBatch } from '@/api/products'

defineProps<{
  product: Product
  batches: readonly ProductProductionBatch[]
  selectedId: number | null
  canManage: boolean
}>()

const emit = defineEmits<{
  back: []
  select: [id: number]
  create: []
}>()

</script>

<template>
  <aside class="batch-rail">
    <button class="batch-rail__back" type="button" @click="emit('back')">
      ← 返回产品列表
    </button>

    <div class="batch-rail__product">
      <ProductImage :file-id="product.imageId" variant="card" />
      <div class="batch-rail__identity">
        <strong>{{ product.name || '-' }}</strong>
        <span>{{ product.code || '-' }}</span>
      </div>
    </div>

    <a-button
      v-if="canManage"
      block
      type="primary"
      class="batch-rail__manage"
      @click="emit('create')"
    >
      ＋ 新增批次
    </a-button>

    <div class="batch-rail__list">
      <button
        v-for="batch in batches"
        :key="batch.id"
        type="button"
        class="batch-rail__item"
        :class="{ 'batch-rail__item--active': selectedId === batch.id }"
        @click="emit('select', batch.id)"
      >
        <span class="batch-rail__item-top">
          <strong>{{ batch.batchNo }}</strong>
          <a-tag :color="batch.qrTotal ? 'green' : 'orange'">
            {{ batch.qrTotal ? '已出码' : '未出码' }}
          </a-tag>
        </span>
        <span>
          {{ batch.quantity?.toLocaleString('zh-CN') || '-' }} 件
          · {{ batch.productionDate || '-' }}
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.batch-rail{border-right:1px solid #dfe7f1;background:#fff}.batch-rail__back{width:100%;border:0;background:transparent;padding:18px 16px 14px;text-align:left;color:#2563eb;font-size:12px;font-weight:600;cursor:pointer}.batch-rail__product{display:flex;align-items:center;gap:12px;padding:0 16px 18px}.batch-rail__product :deep(.product-image){width:40px;height:40px;border-radius:10px}.batch-rail__identity{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:4px}.batch-rail__identity strong{overflow:hidden;color:#172033;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.batch-rail__identity span{color:#64748b;font-size:11px}.batch-rail__manage{width:calc(100% - 24px);height:36px;margin:0 12px 12px;border-radius:10px;font-weight:600}.batch-rail__list{border-top:1px solid #edf1f6}.batch-rail__item{display:flex;width:100%;flex-direction:column;gap:7px;border:0;border-bottom:1px solid #edf1f6;background:#fff;padding:14px 16px;text-align:left;color:#64748b;font-size:11px;cursor:pointer}.batch-rail__item:hover,.batch-rail__item--active{background:#eef4ff}.batch-rail__item--active{box-shadow:inset 3px 0 #2563eb}.batch-rail__item-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#263247;font-size:12px}.batch-rail__item :deep(.ant-tag){margin-inline-end:0;border:0;border-radius:4px;font-size:10px}@media(max-width:900px){.batch-rail{border-right:0;border-bottom:1px solid #e5ebf3}.batch-rail__list{display:flex;overflow-x:auto}.batch-rail__item{min-width:220px;border-right:1px solid #edf1f6}}
</style>
