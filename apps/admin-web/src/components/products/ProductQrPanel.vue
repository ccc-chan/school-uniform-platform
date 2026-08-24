<script setup lang="ts">
import type { ProductProductionBatch } from '@/api/products'

defineProps<{
  batch: ProductProductionBatch
  canView: boolean
  canPrint: boolean
}>()

const emit = defineEmits<{
  preview: []
  print: []
}>()
</script>

<template>
  <section class="qr-panel">
    <header class="qr-panel__header">
      <div class="qr-panel__title">
        <h3>二维码</h3>
        <span v-if="canView">
          共 {{ batch.qrTotal.toLocaleString('zh-CN') }} 个
        </span>
      </div>

      <div
        v-if="canView && canPrint"
        class="qr-panel__actions"
      >
        <a-button
          :disabled="!batch.qrBatches.length"
          @click="emit('preview')"
        >
          浏览二维码
        </a-button>
        <a-button
          type="primary"
          :disabled="!batch.qrBatches.length"
          @click="emit('print')"
        >
          打印下载
        </a-button>
      </div>
    </header>

    <p v-if="!canView" class="qr-panel__empty">
      当前账号没有二维码数据查看权限
    </p>

    <div v-else-if="batch.qrBatches.length" class="qr-panel__list">
      <article v-for="item in batch.qrBatches" :key="item.id">
        <div class="qr-panel__mark" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
        <div class="qr-panel__batch">
          <strong>{{ item.batchNo }}</strong>
          <span>生成 {{ item.total.toLocaleString('zh-CN') }} 枚二维码</span>
          <span>扫描 {{ item.scans.toLocaleString('zh-CN') }} 次</span>
        </div>
      </article>
    </div>

    <p v-else class="qr-panel__empty">该生产批次尚未生成二维码</p>
  </section>
</template>

<style scoped>
.qr-panel {
  min-height: 166px;
  border: 1px solid #dfe7f1;
  border-radius: 14px;
  background: #fff;
  padding: 18px 20px 20px;
}
.qr-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.qr-panel__title {
  display: flex;
  align-items: baseline;
  gap: 9px;
}
.qr-panel__title h3 {
  margin: 0;
  color: #172033;
  font-size: 14px;
}
.qr-panel__title span {
  color: #94a3b8;
  font-size: 11px;
}
.qr-panel__actions {
  display: flex;
  gap: 8px;
}
.qr-panel__actions :deep(.ant-btn) {
  height: 32px;
  border-radius: 8px;
  font-size: 12px;
}
.qr-panel__list {
  margin-top: 12px;
}
.qr-panel__list article {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0;
}
.qr-panel__list article + article {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf1f6;
}
.qr-panel__mark {
  position: relative;
  display: grid;
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  grid-template-columns: repeat(3, 9px);
  grid-template-rows: repeat(3, 9px);
  align-content: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #dfe7f1;
  border-radius: 11px;
  background: #fff;
}
.qr-panel__mark i {
  background: #cbd5e1;
}
.qr-panel__mark i:nth-child(1),
.qr-panel__mark i:nth-child(3),
.qr-panel__mark i:nth-child(5) {
  box-shadow: inset 0 0 0 2px #fff;
}
.qr-panel__mark i:nth-child(6) {
  grid-column: 3;
}
.qr-panel__mark i:nth-child(7) {
  grid-column: 2;
}
.qr-panel__batch {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}
.qr-panel__batch strong {
  margin-bottom: 2px;
  color: #263247;
  font-size: 14px;
}
.qr-panel__batch span {
  color: #8190a7;
  font-size: 11px;
}
.qr-panel__empty {
  margin: 30px 0 12px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}
@media (max-width: 560px) {
  .qr-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
  .qr-panel__mark {
    width: 60px;
    height: 60px;
    flex-basis: 60px;
  }
}
</style>
