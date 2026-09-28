<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import ArchiveModuleNav, { type ArchiveModule } from './ArchiveModuleNav.vue'
import ProductionTimeline from './ProductionTimeline.vue'
import StudentBindingResult from '@/components/student/StudentBindingResult.vue'
import StudentBindingSheet from '@/components/student/StudentBindingSheet.vue'
import { useSchoolUniformInfoViewModel } from '@/features/useSchoolUniformInfoViewModel'
import type { StudentBindingInput } from '@/api/school_uniform_info'

const {
  info,
  qrCodeType,
  traceTypeLabel,
  displayValue,
  studentBinding,
  bindingLoading,
  bindingError,
  bindingSaving,
  bindingSubmitError,
  loadStudentBinding,
  bindStudent,
} = useSchoolUniformInfoViewModel()
const activeModule = shallowRef<ArchiveModule>('product')
const imageFailed = shallowRef(false)
const licensePreviewOpen = shallowRef(false)
const bindingSheetOpen = shallowRef(false)
const justBound = shallowRef(false)
const productImageUrl = computed(() => info.value?.productImageUrl || '')
watch(productImageUrl, () => {
  imageFailed.value = false
})
const title = computed(() =>
  qrCodeType.value === 'school'
    ? info.value?.applicableSchools[0]?.trim() || '适用学校待补充'
    : displayValue(info.value?.productName),
)
const subtitle = computed(() =>
  qrCodeType.value === 'school'
    ? `关联校服 ${displayValue(info.value?.productName)}`
    : `款号 ${displayValue(info.value?.style || info.value?.productCode)}`,
)
const productFacts = computed(() => {
  const item = info.value
  if (!item) return []
  return [
    ['追溯码', displayValue(item.code)],
    ['产品名称', displayValue(item.productName)],
    ['产品类型', displayValue(item.category)],
    ['型号 / 款号', displayValue(item.style || item.productCode)],
    ['洗涤说明', displayValue(item.washingInstructions)],
    ['产品执行标准', displayValue(item.executionStandard)],
    ['品牌', displayValue(item.brandName)],
    ['生产日期', displayValue(item.productionDate)],
    ['出厂编号 / 批次号', displayValue(item.productionBatch)],
    ['纤维成分及含量', displayValue(item.fabricInfo)],
    ['号型 / 尺码', item.sizes.length ? item.sizes.join(' / ') : '暂无'],
  ]
})
const factoryFacts = computed(() => {
  const item = info.value
  if (!item) return []
  return [
    ['生产单位名称', displayValue(item.productionUnitName)],
    ['统一社会信用代码', displayValue(item.productionUnitCreditCode)],
    ['生产 / 注册地址', displayValue(item.productionUnitAddress)],
    ['联系方式', displayValue(item.productionUnitContact)],
  ]
})
const licenseImageUrl = computed(() => {
  const value = info.value?.productionUnitLicense?.trim() || ''
  return /^(https?:\/\/|\/)/i.test(value) ? value : ''
})
async function submitBinding(value: StudentBindingInput) {
  justBound.value = await bindStudent(value)
  if (justBound.value) bindingSheetOpen.value = false
}
</script>

<template>
  <div v-if="info" class="passport-home">
    <header class="passport-brand">
      <strong>SU</strong><span>守护成长的每一件</span>
    </header>
    <section class="passport-product" aria-label="校服数字档案">
      <figure class="passport-photo">
        <img
          v-if="productImageUrl && !imageFailed"
          :src="productImageUrl"
          :alt="`${displayValue(info.productName)}产品图片`"
          @error="imageFailed = true"
        />
        <span v-else class="passport-photo-empty">{{
          imageFailed ? '图片加载失败' : '暂无产品图片'
        }}</span>
      </figure>
      <header class="product-heading">
        <span class="trace-badge">{{ traceTypeLabel }}</span>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </header>
    </section>
    <div class="passport-body">
      <ArchiveModuleNav v-model="activeModule" />
      <section v-if="activeModule === 'product'" class="passport-panel">
        <header class="module-heading"><h2>产品信息</h2></header>
        <dl class="information-list">
          <div v-for="[label, value] in productFacts" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
      <section v-else-if="activeModule === 'factory'" class="passport-panel">
        <header class="module-heading">
          <h2>工厂信息</h2>
          <span>生产单位</span>
        </header>
        <div class="factory-card">
          <span class="factory-mark">名</span>
          <div>
            <strong>{{ displayValue(info.productionUnitName) }}</strong>
            <p>校服生产单位 · 当前溯源主体</p>
          </div>
        </div>
        <dl class="information-list">
          <div v-for="[label, value] in factoryFacts" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
          <div>
            <dt>营业执照</dt>
            <dd>
              <button
                v-if="licenseImageUrl"
                class="text-action"
                type="button"
                @click="licensePreviewOpen = true"
              >
                查看图片
              </button>
              <span v-else>{{ displayValue(info.productionUnitLicense) }}</span>
            </dd>
          </div>
        </dl>
        <p class="factory-note">
          工厂信息用于校服核验生产主体，信息由生产单位维护。
        </p>
      </section>
      <section
        v-else-if="activeModule === 'trace'"
        class="passport-panel passport-panel--timeline"
      >
        <header class="module-heading">
          <h2>溯源流程</h2>
          <span>从生产到扫码</span>
        </header>
        <ProductionTimeline
          :batch-no="info.productionBatch || ''"
          :production-date="info.productionDate || ''"
          :factory-name="info.productionFactoryName || ''"
          :steps="info.productionSteps"
        />
      </section>
      <section v-else class="passport-panel">
        <header class="module-heading">
          <h2>绑定信息</h2>
          <span>家长可选操作</span>
        </header>
        <p v-if="bindingLoading" class="binding-state" role="status">
          正在查询绑定信息…
        </p>
        <div v-else-if="bindingError" class="binding-state" role="alert">
          <p>{{ bindingError }}</p>
          <button type="button" @click="loadStudentBinding">重新查询</button>
        </div>
        <StudentBindingResult
          v-else-if="studentBinding"
          :binding="studentBinding"
          :code="info.code"
          :just-bound="justBound"
        />
        <template v-else>
          <div class="binding-summary">
            <div class="binding-summary__title">
              <strong>当前绑定状态</strong><span>未绑定</span>
            </div>
            <p>
              这件校服当前还没有绑定学生。绑定后，可快速查看孩子对应的校服档案。
            </p>
          </div>
          <button
            class="binding-button"
            type="button"
            @click="bindingSheetOpen = true"
          >
            绑定这件校服
          </button>
        </template>
      </section>
    </div>
    <StudentBindingSheet
      v-model:open="bindingSheetOpen"
      :saving="bindingSaving"
      :error="bindingSubmitError"
      @submit="submitBinding"
    />
    <Teleport to="body"
      ><div
        v-if="licensePreviewOpen && licenseImageUrl"
        class="image-preview"
        role="dialog"
        aria-modal="true"
        aria-label="营业执照图片"
        @click.self="licensePreviewOpen = false"
      >
        <button
          type="button"
          aria-label="关闭图片"
          @click="licensePreviewOpen = false"
        >
          ×</button
        ><img :src="licenseImageUrl" alt="营业执照" /></div
    ></Teleport>
  </div>
</template>

<style scoped>
.passport-home {
  min-height: 100vh;
  padding-bottom: 20px;
  background: #f3f6fb;
}
.passport-brand {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 4px;
  padding: 22px 24px 46px;
  color: #fff;
  background: var(--trace-primary);
}
.passport-brand strong {
  font-size: 27px;
  line-height: 1;
  font-weight: 780;
}
.passport-brand span {
  font-size: 14px;
}
.passport-brand::after {
  position: absolute;
  top: -82px;
  right: 58px;
  width: 48px;
  height: 230px;
  border-radius: 999px;
  background: rgb(255 255 255/11%);
  box-shadow: 76px 0 0 rgb(255 255 255/9%);
  transform: rotate(36deg);
  content: '';
}
.passport-product {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1fr);
  gap: 16px;
  margin: -28px 14px 14px;
  padding: 10px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(25 65 110/5%);
}
.passport-photo {
  position: relative;
  overflow: hidden;
  min-width: 0;
  align-self: center;
  margin: 0;
  border-radius: 12px;
  background: #e9f3ff;
}
.passport-photo img {
  display: block;
  width: 100%;
  min-height: 148px;
  max-height: 168px;
  aspect-ratio: 4/5;
  object-fit: cover;
}
.passport-photo-empty {
  display: grid;
  min-height: 148px;
  padding: 16px;
  place-items: center;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}
.product-heading {
  min-width: 0;
  align-self: center;
  padding: 10px 8px 10px 0;
}
.product-heading .trace-badge {
  display: inline-flex;
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  color: var(--trace-primary);
  background: #e6f1ff;
  font-size: 12px;
  font-weight: 650;
}
.product-heading h1 {
  margin: 14px 0 0;
  color: #101b32;
  font-size: clamp(21px, 6vw, 29px);
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.product-heading p {
  margin: 10px 0 0;
  color: #7c879a;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.passport-body {
  display: grid;
  gap: 12px;
  padding: 0 12px;
}
.passport-panel {
  min-width: 0;
  padding: 16px 14px;
  border: 1px solid #e4eaf2;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 16px rgb(31 60 96/3%);
}
.module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.module-heading h2 {
  margin: 0;
  color: #172236;
  font-size: 15px;
}
.module-heading span {
  color: #8390a5;
  font-size: 11px;
}
.information-list {
  margin: 0;
}
.information-list > div {
  display: grid;
  grid-template-columns: minmax(92px, 0.9fr) minmax(0, 1.5fr);
  gap: 12px;
  align-items: center;
  min-height: 45px;
  border-bottom: 1px solid #e8edf4;
}
.information-list > div:last-child {
  border-bottom: 0;
}
.information-list dt {
  color: #77869c;
  font-size: 12px;
}
.information-list dd {
  min-width: 0;
  margin: 0;
  color: #233a5a;
  font-size: 12px;
  font-weight: 650;
  text-align: right;
  overflow-wrap: anywhere;
}
.factory-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
  padding: 12px;
  border: 1px solid #d9e7f7;
  border-radius: 12px;
  background: #f8fbff;
}
.factory-mark {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  color: #fff;
  background: var(--trace-primary);
  font-size: 18px;
  font-weight: 750;
  place-items: center;
}
.factory-card strong {
  color: #172236;
  font-size: 14px;
}
.factory-card p {
  margin: 4px 0 0;
  color: #8491a5;
  font-size: 11px;
}
.factory-note {
  margin: 12px 0 0;
  padding: 10px 12px;
  border: 1px solid #f3d38d;
  border-radius: 10px;
  color: #9a6914;
  background: #fff8e8;
  font-size: 11px;
  line-height: 1.6;
}
.text-action {
  padding: 4px 8px;
  border: 0;
  border-radius: 7px;
  color: #0958d9;
  background: #edf5ff;
  font-size: 12px;
  font-weight: 650;
}
.passport-panel--timeline :deep(.production-timeline) {
  padding: 2px 2px 8px;
}
.binding-summary {
  margin-top: 8px;
  padding: 14px;
  border: 1px solid #dbe6f3;
  border-radius: 13px;
  background: #f8fbff;
}
.binding-summary__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.binding-summary__title strong {
  font-size: 13px;
}
.binding-summary__title span {
  padding: 4px 9px;
  border-radius: 999px;
  color: #a66500;
  background: #fff0cf;
  font-size: 11px;
}
.binding-summary p {
  margin: 10px 0 0;
  color: #67768d;
  font-size: 12px;
  line-height: 1.7;
}
.binding-button {
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
  border: 0;
  border-radius: 11px;
  color: #fff;
  background: var(--trace-primary);
  font-size: 14px;
  font-weight: 700;
}
.binding-state {
  margin: 20px 0;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}
.binding-state button {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  background: var(--trace-primary);
}
.image-preview {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  padding: 48px 20px;
  background: rgb(11 22 40/82%);
  place-items: center;
}
.image-preview img {
  max-width: min(100%, 560px);
  max-height: 82vh;
  border-radius: 12px;
  background: #fff;
  object-fit: contain;
}
.image-preview button {
  position: fixed;
  top: 18px;
  right: 18px;
  display: grid;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(255 255 255/16%);
  font-size: 26px;
  line-height: 1;
  place-items: center;
}
@media (max-width: 360px) {
  .passport-product {
    gap: 12px;
  }
  .information-list > div {
    grid-template-columns: 88px minmax(0, 1fr);
  }
}
</style>
