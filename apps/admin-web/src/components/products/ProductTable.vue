<script setup lang="ts">
import { productCategoryOptions, productSchoolStageOptions, type Product } from '@/api/products'

const props = defineProps<{ items: readonly Product[]; loading: boolean; permissions: readonly string[]; canEdit: boolean; canStatus: boolean; canDelete: boolean }>()
const emit = defineEmits<{ view: [product: Product]; edit: [product: Product]; toggle: [product: Product]; delete: [product: Product] }>()
const categoryLabels = Object.fromEntries(productCategoryOptions.map((item) => [item.value, item.label]))
const schoolStageLabels = Object.fromEntries(productSchoolStageOptions.map((item) => [item.value, item.label]))
const hasPermission = (code: string) => props.permissions.includes(code) || ((code.endsWith('.view') || code.includes('.field.')) && props.permissions.includes('view'))
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading && !items.length" description="暂无产品，点击“新建产品”开始录入" />
    <div v-else class="product-grid">
      <article v-for="product in items" :key="product.id" class="product-card">
        <div class="product-card__main">
          <div class="product-card__media">
            <ProductImage
              v-if="hasPermission('product.field.image') && product.imageId"
              :file-id="product.imageId"
              variant="card"
            />
            <span v-else>暂无图片</span>
          </div>

          <div class="product-card__content">
            <h3 v-if="hasPermission('product.field.name')" class="product-card__name">
              {{ product.name || '-' }}
            </h3>
            <h3 v-else class="product-card__name">-</h3>

            <dl class="product-card__fields">
              <div>
                <dt>学段年级</dt>
                <dd>{{ schoolStageLabels[product.schoolStage || ''] || '-' }}</dd>
              </div>
              <div>
                <dt>产品类型</dt>
                <dd>
                  {{
                    hasPermission('product.field.category')
                      ? categoryLabels[product.category || ''] || '-'
                      : '-'
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <footer class="product-card__footer">
          <code v-if="hasPermission('product.field.code')">
            {{ product.code || '-' }}
          </code>
          <span v-else />

          <div class="product-card__actions">
            <a-button type="link" size="small" @click="emit('view', product)">详情</a-button>
            <a-button v-if="canEdit" type="link" size="small" @click="emit('edit', product)">编辑</a-button>
            <a-button v-if="canStatus" type="link" size="small" @click="emit('toggle', product)">
              {{ product.status === 'enabled' ? '停用' : '启用' }}
            </a-button>
            <a-button v-if="canDelete" type="link" size="small" danger @click="emit('delete', product)">删除</a-button>
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
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
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
  display: grid;
  width: 42%;
  max-width: 214px;
  height: 160px;
  flex: none;
  overflow: hidden;
  border-radius: 12px;
  background: #f4f7fb;
  color: #94a3b8;
  font-size: 12px;
  place-items: center;
}

.product-card__media :deep(.product-image--card) {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  object-fit: cover;
}

.product-card__content {
  min-width: 0;
  flex: 1;
}

.product-card__name {
  margin: 8px 0 22px;
  overflow: hidden;
  color: #172033;
  font-size: 17px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__fields {
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 14px;
}

.product-card__fields div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-card__fields dt {
  color: #8492a6;
  font-size: 12px;
}

.product-card__fields dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__footer {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-top: 1px solid #edf1f6;
  background: #fbfcfe;
}

.product-card__footer code {
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef4ff;
  color: #315f9f;
  font-size: 12px;
}

.product-card__actions {
  display: flex;
  justify-content: flex-end;
  white-space: nowrap;
}

.product-card__actions :deep(.ant-btn) {
  padding-inline: 6px;
}

@media (max-width: 1199px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 719px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 439px) {
  .product-card__main {
    gap: 12px;
  }

  .product-card__media {
    width: 38%;
  }

  .product-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-card__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
