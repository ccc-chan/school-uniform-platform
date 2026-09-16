<script setup lang="ts">
import { computed, shallowRef, toRef, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import { getQualityReportBlob } from '@/api/quality'
import { useAuthStore } from '@/stores/auth'
import QrManagementOverview from './QrManagementOverview.vue'
import { useQrManagementDetail } from './useQrManagementDetail'

const props = defineProps<{
  id: number
  initialTab: string
  canEdit: boolean
}>()
const emit = defineEmits<{ close: []; changed: [] }>()
const {
  detail,
  loading,
  error,
  qrImage,
  qrError,
  busy,
  activeTab,
  scanPage,
  scanData,
  scanLoading,
  scanError,
  scanRetry,
  sections,
  load,
  toggleAvailability,
  printLabel,
} = useQrManagementDetail(toRef(props, 'id'), () => emit('changed'))
watch(
  () => props.initialTab,
  (value) => {
    activeTab.value = value
  },
  { immediate: true },
)
const informationTabs = [
  { key: 'uniform', label: '校服信息' },
  { key: 'family', label: '学生家长' },
]
const visibleSections = computed(() =>
  sections.value.filter((section) =>
    activeTab.value === 'uniform'
      ? section.title === '校服基础信息' ||
        section.title === '生产单位信息' ||
        section.title === '检测报告'
      : activeTab.value === 'family' &&
        (section.title === '学生信息' || section.title === '家长信息'),
  ),
)
const auth = useAuthStore()
const reportLoading = shallowRef(false)

async function previewReport() {
  const reportId = detail.value?.qualityReportId
  if (!reportId || reportLoading.value) return
  const preview = window.open('about:blank', '_blank')
  if (!preview) {
    message.warning('请允许浏览器打开新窗口后重试')
    return
  }
  preview.opener = null
  reportLoading.value = true
  try {
    const blob = await getQualityReportBlob(reportId)
    if (preview.closed) return
    const url = URL.createObjectURL(blob)
    preview.location.replace(url)
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (cause) {
    preview.close()
    message.error(cause instanceof Error ? cause.message : '检测报告预览失败')
  } finally {
    reportLoading.value = false
  }
}
const scanColumns = [
  { title: '时间', dataIndex: 'scannedAt', width: 160 },
  { title: '二维码ID', dataIndex: 'code', width: 180 },
  {
    title: '学生',
    dataIndex: 'studentName',
    width: 120,
    customRender: ({ text }: { text?: string | null }) => text || '—',
  },
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
  <a-drawer
    :open="true"
    :width="610"
    :closable="false"
    :mask-closable="!busy"
    :keyboard="!busy"
    :header-style="{ padding: '14px 16px' }"
    :body-style="{ padding: '20px 16px' }"
    @close="emit('close')"
  >
    <template #title>
      <div class="qr-detail__title">二维码详情</div>
      <div class="qr-detail__subtitle">
        数字身份档案 · {{ detail?.code || '加载中' }}
      </div>
    </template>
    <template #extra>
      <button
        class="qr-detail__close"
        type="button"
        aria-label="关闭二维码详情"
        :disabled="busy"
        @click="emit('close')"
      >
        ×
      </button>
    </template>
    <a-alert v-if="error" :message="error" type="error" show-icon>
      <template #action
        ><a-button size="small" @click="load">重试</a-button></template
      >
    </a-alert>
    <a-spin :spinning="loading">
      <div v-if="detail" class="qr-detail">
        <section class="qr-detail__identity" aria-label="二维码身份信息">
          <div class="qr-detail__image">
            <img
              v-if="qrImage"
              :src="qrImage"
              :alt="`二维码 ${detail.code}`"
              width="100"
              height="100"
            />
            <span v-else>{{ qrError ? '图片不可用' : '正在加载' }}</span>
          </div>
          <div class="qr-detail__identity-info">
            <h3 class="qr-detail__code">{{ detail.code }}</h3>
            <p class="qr-detail__eyebrow">
              生成于 {{ detail.generatedAt || '—' }}
            </p>
            <a-space wrap :size="4">
              <a-tag
                :color="
                  detail.studentName || detail.status === 'bound'
                    ? 'green'
                    : 'default'
                "
                >{{
                  detail.studentName || detail.status === 'bound'
                    ? '已绑定'
                    : '待绑定'
                }}</a-tag
              >
            </a-space>
          </div>
        </section>
        <a-alert v-if="qrError" :message="qrError" type="warning" show-icon />
      </div>
      <div v-else-if="loading" class="qr-detail__loading">
        正在加载二维码详情
      </div>
    </a-spin>
    <a-tabs
      v-if="detail"
      v-model:active-key="activeTab"
      class="qr-detail__tabs"
    >
      <a-tab-pane key="detail" tab="概览">
        <QrManagementOverview :detail="detail" />
      </a-tab-pane>
      <a-tab-pane
        v-for="tab in informationTabs"
        :key="tab.key"
        :tab="tab.label"
      >
        <div
          class="qr-detail"
          :class="{ 'qr-detail--uniform': tab.key === 'uniform' }"
        >
          <section
            v-for="section in visibleSections"
            :key="section.title"
            class="qr-detail__section"
          >
            <h3 class="qr-detail__heading">{{ section.title }}</h3>
            <dl
              class="qr-detail__fields"
              :class="{
                'qr-detail__fields--report': section.title === '检测报告',
              }"
            >
              <div
                v-for="[label, value] in section.fields"
                :key="label"
                class="qr-detail__field"
              >
                <dt>{{ label }}</dt>
                <dd>{{ value || '—' }}</dd>
              </div>
            </dl>
            <template v-if="section.title === '检测报告'">
              <a-button
                class="qr-detail__report-button"
                :loading="reportLoading"
                :disabled="
                  !detail.qualityReportId ||
                  !auth.hasPermission('quality.report.download')
                "
                @click="previewReport"
                >查看检测报告</a-button
              >
              <p v-if="!detail.qualityReportId" class="qr-detail__report-note">
                暂无检测报告
              </p>
              <p
                v-else-if="!auth.hasPermission('quality.report.download')"
                class="qr-detail__report-note"
              >
                暂无报告查看权限
              </p>
            </template>
          </section>
          <a-space v-if="tab.key === 'uniform'" class="qr-detail__actions" wrap>
            <a-button
              type="primary"
              :loading="busy"
              :disabled="
                !qrImage || detail.disabled || detail.qrStatus === 'voided'
              "
              @click="printLabel"
              >打印标签</a-button
            >
            <a-button
              v-if="canEdit && detail.qrStatus !== 'voided'"
              :danger="!detail.disabled"
              :disabled="busy"
              @click="toggleAvailability"
              >{{ detail.disabled ? '恢复' : '停用' }}</a-button
            >
          </a-space>
        </div>
      </a-tab-pane>
      <a-tab-pane key="records" tab="扫码记录">
        <a-alert v-if="scanError" :message="scanError" type="error" show-icon>
          <template #action
            ><a-button size="small" @click="scanRetry++"
              >重试</a-button
            ></template
          >
        </a-alert>
        <div class="qr-scan-summary">
          <div
            v-for="stat in scanStats"
            :key="stat.key"
            class="qr-scan-summary__item"
          >
            <span class="qr-scan-summary__label">{{ stat.label }}</span>
            <strong class="qr-scan-summary__value">{{
              scanData?.summary?.[stat.key] ?? 0
            }}</strong>
          </div>
        </div>
        <a-table
          :columns="scanColumns"
          :data-source="scanData?.items || []"
          row-key="id"
          :loading="scanLoading"
          :scroll="{ x: 700 }"
          :pagination="{
            current: scanPage,
            pageSize: 10,
            total: scanData?.total || 0,
            showSizeChanger: false,
          }"
          :locale="{ emptyText: '暂无扫码记录' }"
          @change="(pagination) => (scanPage = pagination.current || 1)"
        />
      </a-tab-pane>
      <a-tab-pane key="contacts" tab="联系记录">
        <a-empty description="暂未接入联系记录" />
      </a-tab-pane>
    </a-tabs>
    <template #footer>
      <div class="product-create-drawer__footer">
        <a-button @click="emit('close')">关闭</a-button>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
.qr-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 0 20px;
}
.qr-detail__title {
  color: #18243b;
  font-size: 18px;
  font-weight: 600;
}
.qr-detail__subtitle {
  margin-top: 4px;
  color: #7c8da5;
  font-size: 12px;
  font-weight: 400;
}
.qr-detail__close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #f1f3f6;
  color: #18243b;
  font-size: 22px;
  cursor: pointer;
}
.qr-detail__close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.qr-detail__identity {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #f7f9fb;
}
.qr-detail__image {
  display: grid;
  place-items: center;
  flex: 0 0 102px;
  height: 102px;
  border: 1px solid #dedede;
  background: #fff;
  color: #8492a8;
}
.qr-detail__image img {
  display: block;
}
.qr-detail__identity :deep(.ant-tag) {
  border: 0;
  border-radius: 12px;
  font-size: 11px;
}
.qr-detail__tabs :deep(.ant-tabs-tab) {
  font-size: 12px;
}
.qr-detail__tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 26px;
}
.qr-detail__identity-info {
  min-width: 0;
}
.qr-detail__eyebrow {
  margin: 0 0 8px;
  color: #8492a8;
  font-size: 12px;
}
.qr-detail__code {
  margin: 0 0 4px;
  color: #2468f2;
  font-family: ui-monospace, monospace;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.qr-detail__actions {
  display: flex;
  margin-top: 18px;
}
.qr-detail__heading {
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #18243b;
  font-size: 13px;
  font-weight: 600;
}
.qr-detail__fields {
  margin: 14px 0 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}
.qr-detail__field {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  font-size: 13px;
}
.qr-detail__field dt {
  flex-shrink: 0;
  color: #7c8da5;
}
.qr-detail__field dd {
  margin: 0 0 0 auto;
  color: #25364e;
  text-align: right;
  overflow-wrap: anywhere;
}
.qr-detail__loading {
  padding: 60px 0;
  text-align: center;
  color: #8492a8;
}
.qr-scan-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.qr-scan-summary__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}
.qr-scan-summary__label {
  color: #7c8da5;
  font-size: 13px;
}
.qr-scan-summary__value {
  color: #18243b;
  font-size: 28px;
  line-height: 1;
}
.qr-detail--uniform {
  gap: 20px;
}
.qr-detail--uniform .qr-detail__heading {
  padding-bottom: 0;
  border-bottom: 0;
}
.qr-detail--uniform .qr-detail__section + .qr-detail__section {
  padding-top: 20px;
  border-top: 1px solid #e8edf4;
}
.qr-detail--uniform .qr-detail__fields {
  margin-top: 18px;
  gap: 20px 10px;
}
.qr-detail--uniform .qr-detail__field {
  font-size: 12px;
}
.qr-detail--uniform .qr-detail__field dd {
  font-weight: 600;
}
.qr-detail--uniform .qr-detail__fields--report {
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 8px;
}
.qr-detail__report-button {
  height: 40px;
  padding: 0 16px;
  border-color: #d7e3f9;
  border-radius: 8px;
  color: #25364e;
  font-size: 13px;
  font-weight: 600;
}
.qr-detail__report-note {
  margin: 8px 0 0;
  color: #7c8da5;
  font-size: 12px;
}
@media (max-width: 560px) {
  .qr-detail__fields {
    grid-template-columns: 1fr;
  }
  .qr-scan-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
