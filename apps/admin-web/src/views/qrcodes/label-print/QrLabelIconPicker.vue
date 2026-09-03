<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Modal } from 'ant-design-vue'
import {
  LABEL_ICON_CATEGORIES,
  type LabelIcon,
} from './labelIconCatalog'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  select: [icon: LabelIcon]
}>()

const activeCategoryKey = shallowRef(
  LABEL_ICON_CATEGORIES[0]?.key ?? '',
)

const activeCategory = computed(
  () =>
    LABEL_ICON_CATEGORIES.find(
      (category) => category.key === activeCategoryKey.value,
    ) ?? LABEL_ICON_CATEGORIES[0],
)
const totalIconCount = computed(() =>
  LABEL_ICON_CATEGORIES.reduce(
    (total, category) => total + category.icons.length,
    0,
  ),
)

function selectIcon(icon: LabelIcon) {
  emit('select', icon)
  open.value = false
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="选择图标"
    :width="820"
    :footer="null"
    wrap-class-name="label-icon-picker-modal"
    centered
  >
    <div class="label-icon-picker">
      <header class="label-icon-picker__intro">
        <div>
          <strong>标签图标库</strong>
          <p>选择一个图标，直接添加到标签画布</p>
        </div>
        <span>{{ totalIconCount }} 个图标</span>
      </header>

      <nav
        class="label-icon-picker__categories"
        aria-label="图标分类"
      >
        <button
          v-for="category in LABEL_ICON_CATEGORIES"
          :key="category.key"
          type="button"
          class="label-icon-picker__category"
          :class="{
            'label-icon-picker__category--active':
              category.key === activeCategoryKey,
          }"
          :aria-pressed="category.key === activeCategoryKey"
          @click="activeCategoryKey = category.key"
        >
          <span>{{ category.label }}</span>
          <small>{{ category.icons.length }}</small>
        </button>
      </nav>

      <section
        v-if="activeCategory"
        class="label-icon-picker__panel"
        :aria-label="`${activeCategory.label}图标`"
      >
        <header class="label-icon-picker__heading">
          <div>
            <span>当前分类</span>
            <h3>{{ activeCategory.label }}</h3>
          </div>
          <strong>{{ activeCategory.icons.length }}</strong>
        </header>

        <div class="label-icon-picker__grid">
          <button
            v-for="icon in activeCategory.icons"
            :key="icon.id"
            type="button"
            class="label-icon-picker__item"
            :title="`添加 ${icon.name}`"
            :aria-label="`添加${icon.name}`"
            @click="selectIcon(icon)"
          >
            <img
              :src="icon.url"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span aria-hidden="true">添加</span>
          </button>
        </div>
      </section>

      <p v-else class="label-icon-picker__empty">
        暂无可用图标
      </p>
    </div>
  </Modal>
</template>

<style scoped>
:global(.label-icon-picker-modal .ant-modal-content) {
  overflow: hidden;
  padding: 0;
  border: 1px solid #e5eaf1;
  border-radius: 12px;
  box-shadow:
    0 24px 60px rgb(19 33 55 / 20%),
    0 4px 14px rgb(19 33 55 / 8%);
}

:global(.label-icon-picker-modal .ant-modal-header) {
  margin: 0;
  padding: 18px 22px;
  border-bottom: 1px solid #edf0f4;
}

:global(.label-icon-picker-modal .ant-modal-title) {
  color: #172033;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.2px;
}

:global(.label-icon-picker-modal .ant-modal-close) {
  top: 15px;
  inset-inline-end: 16px;
  border-radius: 6px;
  color: #7f8a9b;
}

:global(.label-icon-picker-modal .ant-modal-close:hover) {
  color: #172033;
  background: #f1f4f8;
}

:global(.label-icon-picker-modal .ant-modal-body) {
  padding: 0;
}

.label-icon-picker {
  color: #172033;
  background: #ffffff;
}

.label-icon-picker__intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 22px 14px;
  background: #f7f9fc;
}

.label-icon-picker__intro strong {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  font-weight: 650;
}

.label-icon-picker__intro p {
  margin: 0;
  color: #7b8798;
  font-size: 12px;
}

.label-icon-picker__intro > span {
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid #dce4ee;
  border-radius: 999px;
  color: #607086;
  background: #ffffff;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.label-icon-picker__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 14px 22px;
  border-bottom: 1px solid #edf0f4;
}

.label-icon-picker__category {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid #dfe5ed;
  border-radius: 999px;
  color: #4b596c;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.label-icon-picker__category:hover {
  border-color: #a9bfdc;
  color: #1f4f87;
  background: #f7faff;
}

.label-icon-picker__category--active {
  border-color: #173a63;
  color: #ffffff;
  background: #173a63;
  box-shadow: 0 4px 10px rgb(23 58 99 / 16%);
}

.label-icon-picker__category small {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 999px;
  color: #8491a3;
  background: #f1f4f7;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.label-icon-picker__category--active small {
  color: #173a63;
  background: #ffffff;
}

.label-icon-picker__panel {
  padding: 17px 22px 22px;
  background: #f8fafc;
}

.label-icon-picker__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  margin-bottom: 10px;
}

.label-icon-picker__heading div > span {
  display: block;
  margin-bottom: 1px;
  color: #8a97a9;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.label-icon-picker__heading h3 {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-weight: 650;
}

.label-icon-picker__heading > strong {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dce5ef;
  border-radius: 8px;
  color: #3e628d;
  background: #ffffff;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.label-icon-picker__grid {
  display: grid;
  height: 350px;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 7px;
  overflow-y: auto;
  padding: 3px 7px 3px 3px;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.label-icon-picker__item {
  position: relative;
  display: flex;
  min-width: 0;
  height: 76px;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 2px rgb(23 32 51 / 3%);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.label-icon-picker__item:hover,
.label-icon-picker__item:focus-visible {
  border-color: #79aef3;
  outline: none;
  box-shadow:
    0 0 0 2px rgb(22 119 255 / 10%),
    0 8px 18px rgb(29 74 128 / 10%);
  transform: translateY(-1px);
}

.label-icon-picker__item img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  transition: transform 150ms ease;
}

.label-icon-picker__item:hover img,
.label-icon-picker__item:focus-visible img {
  transform: translateY(-5px) scale(0.92);
}

.label-icon-picker__item span {
  position: absolute;
  right: 0;
  bottom: 5px;
  left: 0;
  color: #1677ff;
  font-size: 9px;
  font-weight: 600;
  opacity: 0;
  text-align: center;
  transform: translateY(4px);
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.label-icon-picker__item:hover span,
.label-icon-picker__item:focus-visible span {
  opacity: 1;
  transform: translateY(0);
}

.label-icon-picker__empty {
  margin: 0;
  padding: 64px 24px;
  color: #98a3b3;
  text-align: center;
}

@media (max-width: 720px) {
  .label-icon-picker__intro {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .label-icon-picker__categories {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .label-icon-picker__category {
    flex: 0 0 auto;
  }

  .label-icon-picker__grid {
    height: 48vh;
    max-height: 350px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .label-icon-picker__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .label-icon-picker__category,
  .label-icon-picker__item,
  .label-icon-picker__item img,
  .label-icon-picker__item span {
    transition: none;
  }
}
</style>
