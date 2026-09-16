<script setup lang="ts">
import { computed } from 'vue'
import type { QrManagementDetail } from '@/api/qr-management'

const props = defineProps<{ detail: QrManagementDetail }>()

const fields = computed<Array<[string, string | null | undefined]>>(() => [
  ['品牌', props.detail.brandName],
  ['产品', props.detail.productName],
  ['生产单位名称', props.detail.productionUnitName],
  ['统一社会信用代码', props.detail.productionUnitCreditCode],
  ['学校', props.detail.schoolName],
  ['学生', props.detail.studentName],
  ['扫码次数', `${props.detail.scanCount} 次`],
  ['最后扫码', props.detail.lastScannedAt?.match(/\d{2}:\d{2}/)?.[0]],
])

const lifecycle = computed(() =>
  [
    {
      key: 'scan',
      time: props.detail.lastScannedAt,
      title: '最近扫码',
      description: '查看校服身份',
    },
    {
      key: 'binding',
      time: props.detail.studentBoundAt,
      title: '完成绑定',
      description: [
        props.detail.studentName && `学生：${props.detail.studentName}`,
        props.detail.parentName && `家长：${props.detail.parentName}`,
      ]
        .filter(Boolean)
        .join(' · '),
    },
    {
      key: 'generation',
      time: props.detail.generatedAt,
      title: '二维码生成',
      description: '',
    },
  ].filter((event) => event.time),
)
</script>

<template>
  <div class="overview">
    <section class="overview__summary">
      <h3 class="overview__heading">数字身份摘要</h3>
      <dl class="overview__fields">
        <div
          v-for="[label, value] in fields"
          :key="label"
          class="overview__field"
        >
          <dt>{{ label }}</dt>
          <dd>{{ value || '—' }}</dd>
        </div>
      </dl>
    </section>
    <section class="overview__lifecycle">
      <h3 class="overview__heading">生命周期</h3>
      <ol v-if="lifecycle.length" class="overview__timeline">
        <li v-for="event in lifecycle" :key="event.key" class="overview__event">
          <div class="overview__event-heading">
            <span>{{ event.time }}</span>
            <strong>{{ event.title }}</strong>
          </div>
          <p v-if="event.description" class="overview__description">
            {{ event.description }}
          </p>
        </li>
      </ol>
      <p v-else class="overview__description">暂无生命周期记录</p>
    </section>
  </div>
</template>

<style scoped>
.overview {
  color: #18243b;
  font-size: 12px;
}
.overview__heading {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}
.overview__summary {
  padding: 2px 0 24px;
  border-bottom: 1px solid #e8edf4;
}
.overview__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 10px;
  margin: 18px 0 0;
}
.overview__field {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.overview__field dt {
  flex-shrink: 0;
  color: #7c8da5;
}
.overview__field dd {
  margin: 0;
  text-align: right;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.overview__lifecycle {
  padding-top: 20px;
}
.overview__timeline {
  margin: 14px 0 0 22px;
  padding: 0;
  list-style: none;
  border-left: 1px solid #d7e3f9;
}
.overview__event {
  position: relative;
  padding: 0 0 20px 12px;
}
.overview__event::before {
  position: absolute;
  top: 4px;
  left: -5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2868f0;
  content: '';
}
.overview__event-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-weight: 600;
}
.overview__description {
  margin: 4px 0 0;
  color: #7c8da5;
  line-height: 1.6;
}
@media (max-width: 420px) {
  .overview__fields {
    grid-template-columns: 1fr;
  }
}
</style>
