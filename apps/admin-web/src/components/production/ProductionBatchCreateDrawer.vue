<script setup lang="ts">
import {
  CalendarOutlined,
  DeleteOutlined,
  FileProtectOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import message from 'ant-design-vue/es/message'
import {
  createProductionOrderBatch,
  createProductionProductBatch,
  type ProductionBatchCreate,
  type ProductionItem,
} from '@/api/production'
import FileUpload from '@/components/common/FileUpload.vue'

const props = defineProps<{
  open: boolean
  order?: ProductionItem | null
  product?: { id: number; name: string } | null
}>()

const emit = defineEmits<{
  close: []
  created: [batch: ProductionItem]
}>()

const executionStandard = 'GB/T 31888-2015《中小学生校服》'
const safetyOptions = [
  {
    label: 'GB 18401-2010《国家纺织产品基本安全技术规范》B类（14 周岁以上高中生适用）',
    value: 'GB 18401-2010《国家纺织产品基本安全技术规范》B类',
  },
  {
    label: 'GB 31701-2015《婴幼儿及儿童纺织产品安全技术规范》B类（14 周岁及以下中小学生校服强制适用）',
    value: 'GB 31701-2015《婴幼儿及儿童纺织产品安全技术规范》B类',
  },
]
function today() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

const empty = (): ProductionBatchCreate => ({
  quantity: 1,
  productionDate: today(),
  executionStandard,
  safetyCategory: '',
  fabricItems: [{ component: '', ratio: '' }],
  qualityReport: null,
})

const form = reactive<ProductionBatchCreate>(empty())
const saving = shallowRef(false)
const productName = computed(() => props.order?.productName || props.product?.name || '—')

watch(
  () => props.open,
  (open) => {
    if (open) Object.assign(form, empty())
  },
)

function removeReport() {
  form.qualityReport = null
}

function addFabricItem() {
  if (form.fabricItems.length >= 12) return
  form.fabricItems.push({ component: '', ratio: '' })
}

function removeFabricItem(index: number) {
  if (form.fabricItems.length === 1) {
    form.fabricItems[0] = { component: '', ratio: '' }
    return
  }
  form.fabricItems.splice(index, 1)
}

async function submit() {
  if (!props.order && !props.product) return
  if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) {
    message.warning('请填写正确的生产数量')
    return
  }
  if (!form.productionDate) {
    message.warning('请选择生产日期')
    return
  }
  if (!form.executionStandard || !form.safetyCategory) {
    message.warning('请选择执行标准和安全类别')
    return
  }
  const incompleteFabricIndex = form.fabricItems.findIndex(
    (item) => Boolean(item.component.trim()) !== Boolean(item.ratio.trim()),
  )
  if (incompleteFabricIndex >= 0) {
    message.warning(`请完整填写第 ${incompleteFabricIndex + 1} 行的面料成分和配比`)
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      fabricItems: form.fabricItems
        .map((item) => ({
          component: item.component.trim(),
          ratio: item.ratio.trim(),
        }))
        .filter((item) => item.component && item.ratio),
    }
    const batch = props.order
      ? await createProductionOrderBatch(props.order.id, payload)
      : await createProductionProductBatch(props.product!.id, payload)
    message.success(`批次 ${batch.batchNo} 创建成功`)
    emit('created', batch)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '批次创建失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <a-drawer
    :open="open"
    width="min(760px, 100vw)"
    class="batch-create-drawer"
    @close="emit('close')"
  >
    <template #title>
      <div class="drawer-title">
        <span class="drawer-title__icon"><CalendarOutlined /></span>
        <div><small>PRODUCTION BATCH</small><strong>新增生产批次</strong></div>
      </div>
    </template>

    <div class="batch-form">
      <section class="batch-summary">
        <div><span>来源</span><strong>{{ order?.orderNo ? `工单 ${order.orderNo}` : '产品详情' }}</strong></div>
        <div><span>产品</span><strong>{{ productName }}</strong></div>
        <div><span>批次号</span><strong>保存后系统自动生成</strong></div>
      </section>

      <section class="form-section">
        <header><div><h3>生产信息</h3><p>设置本批次需生成的追溯码数量</p></div><span>基础信息</span></header>
        <div class="form-grid">
          <label class="field"><span>生产数量 <em>*</em></span><a-input-number v-model:value="form.quantity" :min="1" :precision="0" class="control" placeholder="请输入生产数量" /><small>对应本批次产品需要的追溯码数量</small></label>
          <label class="field"><span>生产日期 <em>*</em></span><a-date-picker v-model:value="form.productionDate" value-format="YYYY-MM-DD" class="control" placeholder="请选择生产日期" /></label>
        </div>
      </section>

      <section class="form-section">
        <header><div><h3>质量与标准</h3><p>保存本批次独立的质检文件及执行依据</p></div><span>批次质检</span></header>
        <div class="form-grid">
          <label class="field field--wide"><span>执行标准 <em>*</em></span><a-select v-model:value="form.executionStandard" :options="[{ label: executionStandard, value: executionStandard }]" class="control" /></label>
          <label class="field field--wide"><span>安全类别 <em>*</em></span><a-select v-model:value="form.safetyCategory" :options="safetyOptions" class="control" placeholder="请选择适用的安全类别" /></label>
          <div class="field field--wide"><span>质检报告</span><FileUpload v-model:file="form.qualityReport" mode="custom" dragger :auto-upload="false" accept="image/png,image/jpeg,application/pdf" :allowed-types="['image/png', 'image/jpeg', 'application/pdf']" :max-size-mb="10" invalid-type-message="质检报告仅支持 PNG、JPG、JPEG 或 PDF"><div class="report-upload"><FileProtectOutlined /><strong>{{ form.qualityReport ? form.qualityReport.name : '点击或拖拽上传质检报告' }}</strong><span>PNG / JPG / JPEG / PDF，文件不超过 10MB</span></div></FileUpload><a-button v-if="form.qualityReport" type="link" danger size="small" @click="removeReport">移除文件</a-button></div>
        </div>
      </section>

      <section class="form-section">
        <header><div><h3>面料信息</h3><p>补充产品面料成分与配比</p></div><span>材质说明</span></header>
        <div class="fabric-list">
          <div v-for="(item, index) in form.fabricItems" :key="index" class="fabric-row">
            <label class="field"><span>面料成分</span><a-input v-model:value="item.component" :maxlength="40" placeholder="请输入面料成分" /></label>
            <label class="field"><span>面料配比</span><a-input v-model:value="item.ratio" :maxlength="60" placeholder="如 65/35" /></label>
            <a-button v-if="form.fabricItems.length > 1" class="fabric-row__delete" type="text" danger title="删除该行" @click="removeFabricItem(index)"><DeleteOutlined /></a-button>
          </div>
          <a-button class="fabric-add" type="dashed" :disabled="form.fabricItems.length >= 12" @click="addFabricItem"><PlusOutlined />增加面料成分</a-button>
        </div>
      </section>
    </div>

    <template #footer><div class="drawer-footer"><span>* 为必填信息</span><div><a-button @click="emit('close')">取消</a-button><a-button type="primary" :loading="saving" @click="submit">创建批次</a-button></div></div></template>
  </a-drawer>
</template>

<style scoped>
.batch-form{display:flex;flex-direction:column;gap:18px}.drawer-title{display:flex;align-items:center;gap:12px}.drawer-title__icon{display:grid;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#1f6feb,#3b82f6);color:#fff;font-size:20px;place-items:center}.drawer-title small,.drawer-title strong{display:block}.drawer-title small{color:#7c8da5;font-size:10px;letter-spacing:.1em}.drawer-title strong{margin-top:2px;color:#172033;font-size:17px}.batch-summary{display:grid;padding:18px 20px;border:1px solid #dce7f6;border-radius:16px;background:linear-gradient(135deg,#f8fbff,#eef5ff);grid-template-columns:repeat(3,1fr);gap:18px}.batch-summary span,.batch-summary strong{display:block}.batch-summary span{color:#8492a6;font-size:12px}.batch-summary strong{margin-top:6px;color:#213047;font-size:14px}.form-section{padding:22px;border:1px solid #e2e8f0;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(31,70,120,.05)}.form-section header{display:flex;margin-bottom:20px;align-items:flex-start;justify-content:space-between;gap:16px}.form-section h3,.form-section p{margin:0}.form-section h3{color:#14213a;font-size:17px}.form-section p{margin-top:4px;color:#8a98aa;font-size:12px}.form-section header>span{padding:4px 10px;border-radius:999px;background:#f1f6fd;color:#607895;font-size:12px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 22px}.field{display:flex;min-width:0;flex-direction:column;gap:8px;color:#26364d;font-weight:600}.field em{color:#ef4444;font-style:normal}.field small{color:#8a98aa;font-size:12px;font-weight:400}.field--wide{grid-column:1/-1}.control{width:100%}.report-upload{display:flex;min-height:126px;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#2e6fd0}.report-upload :deep(svg){font-size:26px}.report-upload span{color:#8a98aa;font-size:12px;font-weight:400}.fabric-list{display:flex;flex-direction:column;gap:14px}.fabric-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px;align-items:end;gap:14px}.fabric-row__delete{margin-bottom:1px}.fabric-add{align-self:flex-start;color:#2563b9}.drawer-footer{display:flex;align-items:center;justify-content:space-between}.drawer-footer>span{color:#94a3b8;font-size:12px}.drawer-footer>div{display:flex;gap:10px}@media(max-width:640px){.batch-summary,.form-grid{grid-template-columns:1fr}.batch-summary{gap:12px}.field--wide{grid-column:auto}.fabric-row{grid-template-columns:1fr 34px}.fabric-row .field:first-child{grid-column:1/-1}}
</style>
