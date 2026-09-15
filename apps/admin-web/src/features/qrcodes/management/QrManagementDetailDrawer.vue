<script setup lang="ts">
import { toRef, watch } from 'vue'
import { useQrManagementDetail } from './useQrManagementDetail'

const props = defineProps<{ id: number; initialTab: string; canEdit: boolean }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const { detail, loading, error, qrImage, qrError, busy, activeTab, scanPage, scanData, scanLoading, scanError, scanRetry, sections, load, toggleAvailability, printLabel } =
  useQrManagementDetail(toRef(props, 'id'), () => emit('changed'))
watch(() => props.initialTab, (value) => { activeTab.value = value }, { immediate: true })
const scanColumns = [
  { title: '时间', dataIndex: 'scannedAt', width: 160 },
  { title: '二维码ID', dataIndex: 'code', width: 180 },
  { title: '学生', dataIndex: 'studentName', width: 120, customRender: ({ text }: { text?: string | null }) => text || '—' },
  { title: '扫码类型', dataIndex: 'scanType', width: 140 },
]
const scanStats = [
  { key: 'todayScans', label: '今日扫码' },
  { key: 'normalScans', label: '正常扫码' },
  { key: 'duplicateScans', label: '重复扫码' },
  { key: 'abnormalScans', label: '异常扫码' },
] as const
</script>

<template>
  <a-drawer :open="true" title="二维码详情" :width="720" :closable="!busy" :mask-closable="!busy" :keyboard="!busy" @close="emit('close')">
    <a-tabs v-model:active-key="activeTab">
      <a-tab-pane key="detail" tab="基本信息">
        <a-alert v-if="error" :message="error" type="error" show-icon>
          <template #action><a-button size="small" @click="load">重试</a-button></template>
        </a-alert>
        <a-spin :spinning="loading">
          <div v-if="detail" class="qr-detail">
            <section class="qr-detail__identity" aria-label="二维码身份信息">
              <div class="qr-detail__image">
                <img v-if="qrImage" :src="qrImage" :alt="`二维码 ${detail.code}`" width="164" height="164" />
                <span v-else>{{ qrError ? '图片不可用' : '正在加载' }}</span>
              </div>
              <div class="qr-detail__identity-info">
                <p class="qr-detail__eyebrow">校服数字身份</p>
                <h3 class="qr-detail__code">{{ detail.code }}</h3>
                <a-space wrap :size="4">
                  <a-tag v-if="detail.qrStatus === 'voided'" color="red">已作废</a-tag>
                  <a-tag v-else-if="detail.disabled" color="orange">已停用</a-tag>
                  <a-tag :color="detail.qrStatus === 'activated' ? 'green' : 'default'">{{ detail.qrStatus === 'activated' ? '已激活' : '未激活' }}</a-tag>
                  <a-tag :color="detail.version ? 'green' : 'default'">{{ detail.version ? '已绑定' : '未绑定' }}</a-tag>
                </a-space>
                <a-space class="qr-detail__actions" wrap>
                  <a-button type="primary" :loading="busy" :disabled="!qrImage || detail.disabled || detail.qrStatus === 'voided'" @click="printLabel">打印标签</a-button>
                  <a-button v-if="canEdit && detail.qrStatus !== 'voided'" :danger="!detail.disabled" :disabled="busy" @click="toggleAvailability">{{ detail.disabled ? '恢复' : '停用' }}</a-button>
                </a-space>
              </div>
            </section>
            <a-alert v-if="qrError" :message="qrError" type="warning" show-icon />
            <section v-for="section in sections" :key="section.title" class="qr-detail__section">
              <h3 class="qr-detail__heading">{{ section.title }}</h3>
              <dl class="qr-detail__fields">
                <div v-for="[label, value] in section.fields" :key="label" class="qr-detail__field">
                  <dt>{{ label }}</dt><dd>{{ value || '—' }}</dd>
                </div>
              </dl>
            </section>
          </div>
          <div v-else-if="loading" class="qr-detail__loading">正在加载二维码详情</div>
        </a-spin>
      </a-tab-pane>
      <a-tab-pane key="records" tab="扫码记录">
        <a-alert v-if="scanError" :message="scanError" type="error" show-icon>
          <template #action><a-button size="small" @click="scanRetry++">重试</a-button></template>
        </a-alert>
        <div class="qr-scan-summary">
          <div v-for="stat in scanStats" :key="stat.key" class="qr-scan-summary__item">
            <span class="qr-scan-summary__label">{{ stat.label }}</span>
            <strong class="qr-scan-summary__value">{{ scanData?.summary?.[stat.key] ?? 0 }}</strong>
          </div>
        </div>
        <a-table :columns="scanColumns" :data-source="scanData?.items || []" row-key="id" :loading="scanLoading" :scroll="{ x: 700 }"
          :pagination="{ current: scanPage, pageSize: 10, total: scanData?.total || 0, showSizeChanger: false }"
          :locale="{ emptyText: '暂无扫码记录' }" @change="(pagination) => scanPage = pagination.current || 1" />
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>
.qr-detail { display: flex; flex-direction: column; gap: 24px; padding: 4px 0 20px; }
.qr-detail__identity { display: flex; align-items: center; gap: 24px; padding: 20px; border: 1px solid #dce5f1; border-radius: 12px; background: #f8fafc; }
.qr-detail__image { display: grid; place-items: center; flex: 0 0 164px; height: 164px; background: #fff; color: #8492a8; }
.qr-detail__identity-info { min-width: 0; }
.qr-detail__eyebrow { margin: 0 0 8px; color: #8492a8; font-size: 12px; }
.qr-detail__code { margin: 0 0 12px; font-size: 18px; line-height: 1.5; overflow-wrap: anywhere; }
.qr-detail__actions { display: flex; margin-top: 18px; }
.qr-detail__heading { margin: 0; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; color: #18243b; font-size: 16px; font-weight: 600; }
.qr-detail__fields { margin: 14px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 24px; }
.qr-detail__field { display: flex; align-items: baseline; gap: 10px; min-width: 0; font-size: 13px; }
.qr-detail__field dt { flex-shrink: 0; color: #7c8da5; }
.qr-detail__field dd { margin: 0; color: #25364e; overflow-wrap: anywhere; }
.qr-detail__loading { padding: 60px 0; text-align: center; color: #8492a8; }
.qr-scan-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.qr-scan-summary__item { display: flex; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
.qr-scan-summary__label { color: #7c8da5; font-size: 13px; }
.qr-scan-summary__value { color: #18243b; font-size: 28px; line-height: 1; }
@media (max-width: 560px) {
  .qr-detail__identity { flex-direction: column; align-items: stretch; gap: 16px; padding: 16px; }
  .qr-detail__image { width: 164px; align-self: center; }
  .qr-detail__fields { grid-template-columns: 1fr; }
  .qr-scan-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
