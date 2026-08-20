<script setup lang="ts">
import type { AnalyticsOverview } from '@/api/analytics'

const props = defineProps<{ data: AnalyticsOverview }>()
const now = shallowRef(new Date())
let timer: ReturnType<typeof setInterval> | undefined

const timeText = computed(() => now.value.toLocaleString('zh-CN', { hour12: false }))
const topProducts = computed(() => props.data.products.slice(0, 5))
const topRegions = computed(() => props.data.regions.slice(0, 5))

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})
onUnmounted(() => clearInterval(timer))

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <section class="analytics-screen overflow-hidden rounded-4 p-4 text-white sm:p-6">
    <header class="mb-5 flex flex-col gap-2 border-b border-blue-300/15 pb-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <div class="text-xs tracking-[0.2em] text-cyan-300">SCHOOL UNIFORM DIGITAL IDENTITY</div>
      <h2 class="m-0 text-xl font-700 tracking-[0.16em] sm:text-2xl">校服数字身份数据大屏</h2>
      <time class="text-xs text-blue-200/70">{{ timeText }}</time>
    </header>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <article v-for="item in [
        ['扫码总量', data.metrics.scans],
        ['访问人数', data.metrics.visitors],
        ['扫码产品', data.metrics.products],
        ['覆盖区域', data.metrics.regions],
      ]" :key="String(item[0])" class="screen-card px-4 py-5 text-center">
        <span class="text-xs tracking-widest text-blue-200/70">{{ item[0] }}</span>
        <strong class="mt-2 block text-7 font-700 text-cyan-300">{{ formatNumber(Number(item[1])) }}</strong>
      </article>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.55fr_1fr]">
      <article class="screen-card p-4">
        <h3 class="screen-title">热门产品 TOP5</h3>
        <div class="mt-5 space-y-5">
          <div v-for="(item, index) in topProducts" :key="item.productCode" class="grid grid-cols-[28px_minmax(0,1fr)_68px] items-center gap-3 text-xs">
            <span class="text-cyan-300">0{{ index + 1 }}</span>
            <div class="min-w-0"><div class="mb-2 truncate text-blue-100">{{ item.productName }}</div><div class="h-1.5 bg-blue-950"><div class="h-full bg-gradient-to-r from-blue-500 to-cyan-300" :style="{ width: `${item.share}%` }" /></div></div>
            <strong class="text-right text-cyan-300">{{ item.scans }}</strong>
          </div>
          <p v-if="!topProducts.length" class="py-10 text-center text-sm text-blue-200/50">暂无产品数据</p>
        </div>
      </article>

      <article class="screen-card min-w-0 p-4">
        <h3 class="screen-title">扫码访问趋势</h3>
        <AnalyticsTrendChart class="mt-4" :points="data.trend" dark />
      </article>

      <article class="screen-card p-4">
        <h3 class="screen-title">区域访问排行</h3>
        <div class="mt-5 space-y-4">
          <div v-for="(item, index) in topRegions" :key="`${item.province}-${item.city}`" class="rounded-2 border border-blue-400/10 bg-blue-950/40 p-3">
            <div class="flex items-center justify-between text-xs"><span class="text-blue-100">{{ index + 1 }}. {{ item.province }} · {{ item.city }}</span><strong class="text-cyan-300">{{ item.scans }}</strong></div>
            <div class="mt-2 h-1 bg-blue-950"><div class="h-full bg-teal-400" :style="{ width: `${item.share}%` }" /></div>
          </div>
          <p v-if="!topRegions.length" class="py-10 text-center text-sm text-blue-200/50">暂无区域数据</p>
        </div>
      </article>
    </div>

    <footer class="mt-4 flex flex-col gap-2 text-center text-[10px] text-blue-200/50 sm:flex-row sm:justify-between sm:text-left">
      <span>统计周期：{{ data.range.startDate || '-' }} 至 {{ data.range.endDate || '-' }}</span>
      <span>数据每次刷新后同步更新</span>
    </footer>
  </section>
</template>

<style scoped>
.analytics-screen {
  background:
    radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.28), transparent 40%),
    linear-gradient(145deg, #03122f, #061d45 55%, #03132f);
  min-height: calc(100vh - 140px);
  box-shadow: inset 0 0 80px rgba(59, 130, 246, 0.08);
}
.screen-card {
  border: 1px solid rgba(96, 165, 250, 0.16);
  background: linear-gradient(160deg, rgba(8, 34, 76, 0.92), rgba(4, 20, 50, 0.88));
  box-shadow: inset 0 0 24px rgba(37, 99, 235, 0.08);
}
.screen-title {
  margin: 0;
  color: #dbeafe;
  font-size: 0.875rem;
  letter-spacing: 0.12em;
}
</style>
