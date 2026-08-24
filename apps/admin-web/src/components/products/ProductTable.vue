<script setup lang="ts">
import {
  productQrCodeTypeOptions,
  type Product,
  type ProductQrCodeType,
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

const qrCodeTypeLabels = Object.fromEntries(
  productQrCodeTypeOptions.map((item) => [item.value, item.label]),
)

const qrCodeTypeColors: Record<ProductQrCodeType, string> = {
  product: 'purple',
  batch: 'purple',
  school: 'orange',
}

const hasPermission = (code: string) =>
  props.permissions.includes(code) ||
  ((code.endsWith('.view') || code.includes('.field.')) &&
    props.permissions.includes('view'))
const sizeLabel = (product: Product) =>
  product.sizes?.map((size) => size.toUpperCase()).join('-') || ''
const specificationLabel = (product: Product) =>
  [
    product.fabricInfo?.trim(),
    product.sizes?.length ? `尺码 ${sizeLabel(product)}` : '',
  ]
    .filter(Boolean)
    .join(' · ') || '产品信息待补充'
const createdDate = (value?: string) => value?.slice(0, 10) || '-'
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty
      v-if="!loading && !items.length"
      description="暂无产品，点击“新建产品”开始录入"
    />

    <div v-else class="product-grid">
      <article v-for="product in items" :key="product.id" class="product-card">
        <div class="product-card__main">
          <div class="product-card__media">
            <ProductImage
              v-if="
                hasPermission('product.field.image') && product.imageId
              "
              :file-id="product.imageId"
              variant="card"
            />
          </div>

          <div class="product-card__content">
            <h3
              v-if="hasPermission('product.field.name')"
              class="product-card__name"
            >
              {{ product.name || '-' }}
            </h3>

            <p class="product-card__spec">
              {{ specificationLabel(product) }}
            </p>

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
              >
                {{ product.status === 'enabled' ? '已启用' : '已停用' }}
              </a-tag>
            </div>

            <div
              v-if="
                hasPermission('production.view') ||
                hasPermission('product.field.created_at')
              "
              class="product-card__summary"
            >
              <span v-if="hasPermission('production.view')">
                批次 <strong>{{ product.batchCount ?? 0 }}</strong>
              </span>
              <span
                v-if="
                  hasPermission('production.view') &&
                  hasPermission('production.field.quantity')
                "
              >
                总量
                <strong>
                  {{
                    Number(product.totalQuantity || 0).toLocaleString('zh-CN')
                  }}
                </strong>
              </span>
              <span v-if="hasPermission('product.field.created_at')">
                创建时间 <strong>{{ createdDate(product.createdAt) }}</strong>
              </span>
            </div>
          </div>
        </div>

        <footer class="product-card__footer">
          <span
            v-if="hasPermission('product.field.code')"
            class="product-card__code"
          >
            {{ product.code || '-' }}
          </span>
          <span v-else />

          <div class="product-card__actions">
            <a-button
              class="product-card__action product-card__action--detail"
              type="link"
              size="small"
              @click="emit('view', product)"
            >
              详情
            </a-button>
            <a-button
              v-if="canEdit"
              class="product-card__action product-card__action--edit"
              type="link"
              size="small"
              @click="emit('edit', product)"
            >
              编辑
            </a-button>
            <a-button
              v-if="canStatus"
              class="product-card__action"
              :class="
                product.status === 'enabled'
                  ? 'product-card__action--warning'
                  : 'product-card__action--success'
              "
              type="link"
              size="small"
              @click="emit('toggle', product)"
            >
              {{ product.status === 'enabled' ? '停用' : '启用' }}
            </a-button>
            <a-button
              v-if="canDelete"
              class="product-card__action"
              type="link"
              size="small"
              danger
              @click="emit('delete', product)"
            >
              删除
            </a-button>
          </div>
        </footer>
      </article>
    </div>
  </a-spin>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.product-card {
  display: flex;
  min-width: 0;
  border: 1px solid #dfe7f1;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 2%);
  flex-direction: column;
  overflow: hidden;
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

.product-card__main {
  display: flex;
  min-height: 184px;
  gap: 20px;
  padding: 12px;
}

.product-card__media {
  width: 42%;
  max-width: 214px;
  height: 160px;
  flex: none;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}

.product-card__media :deep(.product-image--card) {
  width: 100%;
  height: 100%;
  border: 0;
}

.product-card__content {
  min-width: 0;
  padding: 3px 2px;
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

.product-card__spec {
  overflow: hidden;
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.product-card__badges :deep(.ant-tag) {
  margin-inline-end: 0;
  border-radius: 4px;
  font-size: 11px;
  line-height: 20px;
}

.product-card__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 12px;
  color: #8a9bb1;
  font-size: 12px;
  line-height: 1.5;
}

.product-card__summary strong {
  margin-left: 5px;
  color: #172033;
  font-size: 13px;
  font-weight: 600;
}

.product-card__footer {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 5px 14px;
  border-top: 1px solid #edf1f6;
}

.product-card__code {
  min-width: 0;
  overflow: hidden;
  color: #8da0b9;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: 2px;
}

.product-card__action {
  height: 28px;
  padding-inline: 5px;
  font-size: 12px;
}

.product-card__action--edit {
  color: #53657c;
}

.product-card__action--warning {
  color: #d97706;
}

.product-card__action--success {
  color: #059669;
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

  .product-card__main {
    min-height: 0;
    flex-direction: column;
  }

  .product-card__media {
    width: 100%;
    max-width: none;
    height: 190px;
  }

  .product-card__content {
    padding: 2px;
  }

  .product-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-card__actions {
    width: 100%;
    justify-content: flex-end;
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
