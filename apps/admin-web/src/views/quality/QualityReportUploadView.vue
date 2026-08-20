<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createQualityReport,
  getQualityOptions,
  type QualityOptions,
  type QualityReportCreate,
} from '@/api/quality'
import QualityReportForm from '@/components/quality/QualityReportForm.vue'

const router = useRouter()
const loading = shallowRef(true)
const submitting = shallowRef(false)
const options = shallowRef<QualityOptions>({ products: [], items: [] })

async function load() {
  try {
    options.value = await getQualityOptions()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '基础数据加载失败')
  } finally {
    loading.value = false
  }
}

async function submit(value: QualityReportCreate) {
  submitting.value = true
  try {
    const report = await createQualityReport(value)
    message.success('检测报告上传成功')
    await router.replace(`/quality/reports/${report.id}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '检测报告上传失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-350 space-y-4">
    <div class="page-card">
      <div class="flex items-center gap-3">
        <a-button type="text" @click="router.push('/quality/reports')">←</a-button>
        <div>
          <h2 class="page-title">上传检测报告</h2>
          <p class="mb-0 mt-2 text-secondary">
            关联产品、录入检测结果并上传机构出具的 PDF 报告
          </p>
        </div>
      </div>
    </div>

    <a-skeleton v-if="loading" active class="page-card" />
    <QualityReportForm
      v-else
      :options="options"
      :submitting="submitting"
      @submit="submit"
      @cancel="router.push('/quality/reports')"
    />
  </section>
</template>
