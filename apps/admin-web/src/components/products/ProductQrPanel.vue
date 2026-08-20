<script setup lang="ts">
import type { ProductProductionBatch } from '@/api/products'

defineProps<{
  batch: ProductProductionBatch
  canView: boolean
  canPrint: boolean
}>()

const emit = defineEmits<{
  labels: []
}>()
</script>

<template>
  <section class="qr-panel">
    <header class="qr-panel__header">
      <h3>二维码</h3>
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
          <span>
            共 {{ item.total.toLocaleString('zh-CN') }} 枚
            · 扫描 {{ item.scans.toLocaleString('zh-CN') }} 次
          </span>
        </div>
        <div v-if="canPrint" class="qr-panel__actions">
          <button type="button" @click="emit('labels')">下载</button>
          <button type="button" class="qr-panel__preview" @click="emit('labels')">
            预览
          </button>
        </div>
      </article>
    </div>

    <p v-else class="qr-panel__empty">该生产批次尚未生成二维码</p>
  </section>
</template>

<style scoped>
.qr-panel{border:1px solid #dfe7f1;border-radius:14px;background:#fff;padding:16px}.qr-panel__header{display:flex;align-items:center;justify-content:space-between;gap:20px}.qr-panel__header h3{margin:0;color:#172033;font-size:14px}.qr-panel__list{margin-top:12px}.qr-panel__list article{display:flex;align-items:center;gap:12px;padding:4px 0}.qr-panel__list article+article{margin-top:10px;padding-top:14px;border-top:1px solid #edf1f6}.qr-panel__mark{position:relative;display:grid;width:64px;height:64px;flex:0 0 64px;grid-template-columns:repeat(3,8px);grid-template-rows:repeat(3,8px);align-content:center;justify-content:center;gap:5px;border:1px solid #dfe7f1;border-radius:9px;background:#fff}.qr-panel__mark i{background:#cbd5e1}.qr-panel__mark i:nth-child(1),.qr-panel__mark i:nth-child(3),.qr-panel__mark i:nth-child(5){box-shadow:inset 0 0 0 2px #fff}.qr-panel__mark i:nth-child(6){grid-column:3}.qr-panel__mark i:nth-child(7){grid-column:2}.qr-panel__batch{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.qr-panel__batch strong{color:#263247;font-size:13px}.qr-panel__batch span{color:#8190a7;font-size:11px}.qr-panel__actions{display:flex;gap:14px}.qr-panel__actions button{border:0;background:transparent;padding:2px;color:#2563eb;font-size:12px;cursor:pointer}.qr-panel__actions .qr-panel__preview{color:#64748b}.qr-panel__empty{margin:18px 0 4px;color:#94a3b8;font-size:12px;text-align:center}@media(max-width:560px){.qr-panel__mark{width:52px;height:52px;flex-basis:52px}.qr-panel__actions{flex-direction:column;gap:4px}}
</style>
