<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import {
  recordPublicQrScan,
  type QrPublicTrace,
  type QrStatus,
} from '@/api/qrcodes'

const route = useRoute()
const trace = shallowRef<QrPublicTrace | null>(null)
const loading = shallowRef(true)
const errorMessage = shallowRef('')
const code = computed(() => String(route.params.code || '').trim())

const statusLabels: Record<QrStatus, string> = {
  unbound: '待绑定',
  bound: '已绑定',
  activated: '已激活',
  voided: '已作废',
}

const facts = computed(() => {
  const item = trace.value
  if (!item) return []
  return [
    ['产品编号', item.productCode],
    ['生产批次', item.productionBatch],
    ['款号 / SKU', item.productSku || item.style],
    ['类别 / 季节', [item.category, item.season].filter(Boolean).join(' · ')],
    ['颜色', item.color],
    ['面料信息', item.fabricInfo],
    ['执行标准', item.executionStandard],
  ].filter(([, value]) => value)
})

onMounted(async () => {
  try {
    trace.value = await recordPublicQrScan(code.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '追溯信息加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="trace-page">
    <header class="trace-page__brand">
      <span class="trace-page__mark">SU</span>
      <div>
        <strong>校服数字身份</strong>
        <span>School Uniform Digital Identity</span>
      </div>
    </header>

    <section class="trace-card" aria-live="polite">
      <div v-if="loading" class="trace-card__state">正在核验数字身份…</div>

      <div v-else-if="errorMessage" class="trace-card__state trace-card__state--error">
        <span>无法核验</span>
        <h1>二维码无效或已作废</h1>
        <p>{{ errorMessage }}</p>
        <code>{{ code }}</code>
      </div>

      <template v-else-if="trace">
        <div class="trace-card__verified">✓ 数字身份有效</div>
        <p class="trace-card__eyebrow">
          {{ statusLabels[trace.status] }}
        </p>
        <h1>{{ trace.productName || '校服产品' }}</h1>
        <p class="trace-card__intro">
          本二维码已通过平台校验，以下信息来自校服产品档案。
        </p>

        <div class="trace-card__serial">
          <span>追溯编码</span>
          <strong>{{ trace.code }}</strong>
        </div>

        <dl class="trace-card__facts">
          <div v-for="[label, value] in facts" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>

        <footer>
          核验时间 {{ trace.scannedAt }} · URL 型二维码数据载体
        </footer>
      </template>
    </section>
  </main>
</template>

<style scoped>
.trace-page {
  min-height: 100vh;
  padding: 32px 18px 48px;
  color: #0b1f33;
  background:
    linear-gradient(rgb(23 107 91 / 7%) 1px, transparent 1px),
    #f4f7f5;
  background-size: 100% 24px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.trace-page__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 620px);
  margin: 0 auto 28px;
}

.trace-page__brand div {
  display: flex;
  flex-direction: column;
}

.trace-page__brand span {
  color: #64756f;
  font-size: 11px;
}

.trace-page__mark {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  place-items: center;
  color: #fff !important;
  background: #176b5b;
  font-family: "DIN Alternate", sans-serif;
  font-size: 16px !important;
  font-weight: 800;
}

.trace-card {
  width: min(100%, 620px);
  margin: auto;
  padding: 30px;
  border: 1px solid #d8e2dc;
  border-radius: 18px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 22px 70px rgb(11 31 51 / 10%);
}

.trace-card__verified {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  color: #176b5b;
  background: #e5f2ed;
  font-size: 13px;
  font-weight: 700;
}

.trace-card__eyebrow {
  margin: 24px 0 6px;
  color: #c59b57;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.trace-card h1 {
  margin: 0;
  font-family: "Songti SC", serif;
  font-size: clamp(28px, 7vw, 42px);
}

.trace-card__intro {
  margin: 12px 0 24px;
  color: #64756f;
  line-height: 1.75;
}

.trace-card__serial {
  padding: 16px 18px;
  border-left: 4px solid #c59b57;
  color: #fff;
  background: #0b1f33;
}

.trace-card__serial span,
.trace-card__serial strong {
  display: block;
}

.trace-card__serial span {
  margin-bottom: 5px;
  color: #aebbc4;
  font-size: 11px;
}

.trace-card__serial strong {
  overflow-wrap: anywhere;
  font-family: "DIN Alternate", monospace;
  letter-spacing: 0.06em;
}

.trace-card__facts {
  margin: 24px 0;
}

.trace-card__facts div {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px dashed #d8e2dc;
}

.trace-card__facts dt {
  color: #73827d;
}

.trace-card__facts dd {
  margin: 0;
  font-weight: 600;
}

.trace-card footer,
.trace-card__state p {
  color: #73827d;
  font-size: 12px;
  line-height: 1.7;
}

.trace-card__state {
  padding: 54px 0;
  text-align: center;
}

.trace-card__state--error span {
  color: #b42318;
  font-weight: 700;
}

.trace-card__state code {
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .trace-card {
    padding: 24px 20px;
  }

  .trace-card__facts div {
    grid-template-columns: 82px 1fr;
  }
}
</style>
