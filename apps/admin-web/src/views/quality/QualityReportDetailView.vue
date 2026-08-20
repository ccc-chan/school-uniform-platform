<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  getQualityReport,
  getQualityReportBlob,
  reviewQualityReport,
  type QualityReport,
} from '@/api/quality'
import QualityReportDetail from '@/components/quality/QualityReportDetail.vue'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/utils/modal'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const report = shallowRef<QualityReport | null>(null)
const loading = shallowRef(true)
const reviewing = shallowRef(false)

const canReview = computed(() => auth.hasPermission('quality.report.review'))
const canDownload = computed(() => auth.hasPermission('quality.report.download'))

async function load() {
  loading.value = true
  try {
    report.value = await getQualityReport(Number(route.params.id))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测报告加载失败')
  } finally {
    loading.value = false
  }
}

async function download() {
  if (!report.value) return
  try {
    const blob = await getQualityReportBlob(report.value.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '报告文件打开失败')
  }
}

function confirmReview(status: 'approved' | 'rejected') {
  if (!report.value) return
  const approved = status === 'approved'
  confirmAction({
    title: approved ? '确认审核通过' : '确认驳回报告',
    content: approved
      ? '审核通过后，该检测报告将对外显示为有效报告。'
      : '驳回后需要重新上传检测报告，确定继续吗？',
    okType: approved ? 'primary' : 'danger',
    async onOk() {
      if (!report.value) return
      reviewing.value = true
      try {
        report.value = await reviewQualityReport(report.value.id, status)
        message.success(approved ? '检测报告已通过审核' : '检测报告已驳回')
      } catch (error) {
        message.error(error instanceof Error ? error.message : '审核操作失败')
        throw error
      } finally {
        reviewing.value = false
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div>
      <a-button type="link" class="px-0" @click="router.push('/quality/reports')">
        ← 返回检测报告列表
      </a-button>
    </div>
    <a-skeleton v-if="loading" active class="page-card" />
    <a-result
      v-else-if="!report"
      status="404"
      title="检测报告不存在"
      class="page-card"
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/quality/reports')">
          返回列表
        </a-button>
      </template>
    </a-result>
    <QualityReportDetail
      v-else
      :report="report"
      :can-review="canReview"
      :can-download="canDownload"
      :reviewing="reviewing"
      @download="download"
      @review="confirmReview"
    />
  </section>
</template>
