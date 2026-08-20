<script setup lang="ts">
import {
  productCategoryOptions,
  productQrCodeTypeOptions,
  productSeasonOptions,
  type Product,
  type ProductQrCodeType,
  type ProductSeason,
} from '@/api/products'

const props = defineProps<{
  items: readonly Product[]
  loading: boolean
  permissions: readonly string[]
  canEdit: boolean
  canStatus: boolean
  canDelete: boolean
}>()
const emit = defineEmits<{
  view: [product: Product]
  edit: [product: Product]
  toggle: [product: Product]
  delete: [product: Product]
}>()
const categoryLabels = Object.fromEntries(
  productCategoryOptions.map((item) => [item.value, item.label]),
)
const qrCodeTypeLabels = Object.fromEntries(
  productQrCodeTypeOptions.map((item) => [item.value, item.label]),
)
const seasonLabels = Object.fromEntries(
  productSeasonOptions.map((item) => [item.value, item.label]),
)
const seasonClasses: Record<ProductSeason, string> = {
  spring: 'product-card__season--spring',
  summer: 'product-card__season--summer',
  autumn: 'product-card__season--autumn',
  winter: 'product-card__season--winter',
  all_season: 'product-card__season--all',
}
const qrCodeTypeColors: Record<ProductQrCodeType, string> = {
  product: 'blue',
  batch: 'purple',
  school: 'orange',
}
const hasPermission = (code: string) => props.permissions.includes(code)
const seasonClass = (season?: ProductSeason) =>
  season ? seasonClasses[season] : seasonClasses.all_season
const seasonShortLabel = (season?: ProductSeason) =>
  season ? (seasonLabels[season]?.slice(0, 1) ?? '季') : '季'
const categoryLabel = (product: Product) =>
  product.category ? categoryLabels[product.category] : '-'
const sizeLabel = (product: Product) =>
  product.sizes?.map((size) => size.toUpperCase()).join(' / ') || '-'
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty
      v-if="!loading && !items.length"
      description="暂无产品，点击“新建产品”开始录入"
    />
    <div v-else class="product-grid">
      <article v-for="product in items" :key="product.id" class="product-card">
        <div class="product-card__header">
          <span
            v-if="hasPermission('product.field.season')"
            class="product-card__season"
            :class="seasonClass(product.season)"
            >{{ seasonShortLabel(product.season) }}</span
          >
          <div class="product-card__badges">
            <a-tag
              v-if="product.qrCodeType"
              :color="qrCodeTypeColors[product.qrCodeType]"
            >
              {{ qrCodeTypeLabels[product.qrCodeType] }}
            </a-tag>
            <a-tag
              v-if="hasPermission('product.field.status')"
              :color="product.status === 'enabled' ? 'green' : 'default'"
              class="product-card__status"
            >
              {{ product.status === 'enabled' ? '已启用' : '已停用' }}
            </a-tag>
          </div>
        </div>
        <div class="product-card__body">
          <div class="product-card__content">
            <h3
              v-if="hasPermission('product.field.name')"
              class="product-card__name"
            >
              {{ product.name || '-' }}
            </h3>
            <div class="product-card__meta">
              <span v-if="hasPermission('product.field.code')">{{
                product.code || '-'
              }}</span>
              <span v-if="hasPermission('product.field.category')">{{
                categoryLabel(product)
              }}</span>
            </div>
            <div class="product-card__spec">
              <span v-if="product.color">{{ product.color }}</span>
              <span v-if="product.sizes?.length">{{ sizeLabel(product) }}</span>
            </div>
            <div
              v-if="hasPermission('production.view')"
              class="product-card__stats"
            >
              <div class="product-card__stat">
                <span>批次</span><strong>{{ product.batchCount ?? 0 }}</strong>
              </div>
              <div
                v-if="hasPermission('production.field.quantity')"
                class="product-card__stat"
              >
                <span>总量</span
                ><strong>{{
                  Number(product.totalQuantity || 0).toLocaleString('zh-CN')
                }}</strong>
              </div>
            </div>
          </div>
          <ProductImage
            v-if="hasPermission('product.field.image')"
            :file-id="product.imageId"
            variant="card"
          />
        </div>

        <div class="product-card__footer">
          <div
            v-if="hasPermission('product.field.created_at')"
            class="product-card__created"
          >
            <span>创建时间</span><strong>{{ product.createdAt || '-' }}</strong>
          </div>
          <a-space size="small">
            <a-button type="link" size="small" @click="emit('view', product)"
              >详情</a-button
            >
            <a-button
              v-if="canEdit"
              type="link"
              size="small"
              @click="emit('edit', product)"
              >编辑</a-button
            >
            <a-button
              v-if="canStatus"
              type="link"
              size="small"
              :danger="product.status === 'enabled'"
              @click="emit('toggle', product)"
              >{{ product.status === 'enabled' ? '停用' : '启用' }}</a-button
            >
            <a-button
              v-if="canDelete"
              type="link"
              size="small"
              danger
              @click="emit('delete', product)"
              >删除</a-button
            >
          </a-space>
        </div>
      </article>
    </div>
  </a-spin>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.product-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid #dfe7f1;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 2%);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}
.product-card:hover {
  border-color: #b8cff5;
  box-shadow: 0 10px 24px rgb(37 99 235 / 8%);
  transform: translateY(-2px);
}
.product-card__header,
.product-card__body,
.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.product-card__header {
  min-height: 44px;
}
.product-card__season {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}
.product-card__season--spring {
  color: #1677ff;
  background: #eaf3ff;
}
.product-card__season--summer {
  color: #d97706;
  background: #fff7df;
}
.product-card__season--autumn {
  color: #7c3aed;
  background: #f2edff;
}
.product-card__season--winter {
  color: #059669;
  background: #e8f8f2;
}
.product-card__season--all {
  color: #0891b2;
  background: #e8f8fb;
}
.product-card__status {
  margin-inline-end: 0;
}
.product-card__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.product-card__badges :deep(.ant-tag) {
  margin-inline-end: 0;
}
.product-card__body {
  min-height: 104px;
  gap: 18px;
}
.product-card__content {
  min-width: 0;
  flex: 1;
}
.product-card__name {
  overflow: hidden;
  margin: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-card__meta,
.product-card__spec {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: #64748b;
  font-size: 13px;
}
.product-card__meta {
  margin-top: 8px;
}
.product-card__spec {
  margin-top: 7px;
  color: #94a3b8;
  font-size: 12px;
}
.product-card__meta span + span::before,
.product-card__spec span + span::before {
  margin-right: 12px;
  color: #cbd5e1;
  content: '·';
}
.product-card__stats {
  display: flex;
  min-height: 48px;
  align-items: flex-end;
  gap: 26px;
  margin-top: 8px;
}
.product-card__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.product-card__stat span {
  color: #94a3b8;
  font-size: 11px;
}
.product-card__stat strong {
  color: #172033;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}
.product-card__footer {
  min-height: 50px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf1f6;
  gap: 12px;
}
.product-card__created {
  min-width: 0;
  display: flex;
  flex-direction: column;
  color: #94a3b8;
  font-size: 11px;
}
.product-card__created strong {
  overflow: hidden;
  margin-top: 3px;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1199px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
  .product-card {
    padding: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .product-card {
    transition: none;
  }
  .product-card:hover {
    transform: none;
  }
}
</style>
