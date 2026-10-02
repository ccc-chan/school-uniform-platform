<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue'
import {
  getSchools,
  schoolTypeOptions,
  type SchoolOption,
  type SchoolType,
} from '@/api/schools'

const model = defineModel<number>({ required: true })
const query = shallowRef('')
const schoolType = shallowRef<SchoolType | ''>('')
const selectedLabel = shallowRef('')
const options = shallowRef<SchoolOption[]>([])
const page = shallowRef(0)
const hasMore = shallowRef(true)
const loading = shallowRef(false)
const open = shallowRef(false)
const error = shallowRef('')
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let sequence = 0

async function load(nextPage: number, replace = false) {
  if (!replace && (loading.value || !hasMore.value)) return
  const current = ++sequence
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const result = await getSchools(
      query.value.trim(),
      schoolType.value,
      nextPage,
      controller.signal,
    )
    if (current !== sequence) return
    options.value = replace ? result.items : [...options.value, ...result.items]
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'AbortError') return
    if (current === sequence)
      error.value =
        reason instanceof Error ? reason.message : '学校列表加载失败'
  } finally {
    if (current === sequence) loading.value = false
  }
}

function focus() {
  open.value = true
  if (page.value === 0) void load(1, true)
}

function search() {
  model.value = 0
  selectedLabel.value = ''
  open.value = true
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void load(1, true), 250)
}

function changeSchoolType() {
  model.value = 0
  selectedLabel.value = ''
  query.value = ''
  page.value = 0
  hasMore.value = true
  open.value = true
  void load(1, true)
}

function selectSchoolType(type: SchoolType | '') {
  if (schoolType.value === type) return
  schoolType.value = type
  changeSchoolType()
}

function select(school: SchoolOption) {
  model.value = school.id
  selectedLabel.value = school.name
  query.value = school.name
  open.value = false
}

function closeLater() {
  setTimeout(() => {
    open.value = false
  }, 150)
}

onBeforeUnmount(() => {
  controller?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="school-select">
    <input
      v-model="query"
      role="combobox"
      aria-label="学校名称"
      :aria-expanded="open"
      aria-controls="school-options"
      autocomplete="off"
      :placeholder="schoolType ? `搜索${schoolType}学校` : '输入学校名称搜索'"
      required
      @focus="focus"
      @input="search"
      @blur="closeLater"
    />
    <div v-if="open" id="school-options" class="school-options" role="listbox">
      <div class="school-type-filters" aria-label="按学校类型筛选">
        <button
          type="button"
          :class="{ selected: schoolType === '' }"
          @mousedown.prevent="selectSchoolType('')"
        >
          全部
        </button>
        <button
          v-for="type in schoolTypeOptions"
          :key="type"
          type="button"
          :class="{ selected: schoolType === type }"
          @mousedown.prevent="selectSchoolType(type)"
        >
          {{ type }}
        </button>
      </div>
      <button
        v-for="school in options"
        :key="school.id"
        class="school-result"
        type="button"
        role="option"
        :aria-selected="model === school.id"
        @mousedown.prevent="select(school)"
      >
        <strong>{{ school.name }}</strong>
        <span>{{ school.schoolType }}</span>
      </button>
      <p v-if="loading" class="school-state">正在加载…</p>
      <p v-else-if="error" class="school-state school-state--error">
        {{ error }}
      </p>
      <p v-else-if="!options.length" class="school-state">未找到匹配学校</p>
      <button
        v-else-if="hasMore"
        class="school-more"
        type="button"
        @mousedown.prevent="load(page + 1)"
      >
        加载更多
      </button>
    </div>
    <input
      :value="model || ''"
      tabindex="-1"
      aria-hidden="true"
      class="school-required"
      required
    />
  </div>
</template>

<style scoped>
.school-select {
  position: relative;
  margin-top: 8px;
}
.school-select > input:not(.school-required) {
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid #d5deeb;
  border-radius: 11px;
  color: #172236;
  background: #fff;
  font-size: 14px;
}
.school-select > input:focus {
  outline: 2px solid #b8d6ff;
  outline-offset: 1px;
  border-color: #1677ff;
}
.school-options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 320px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #d6e7ff;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 14px 38px rgb(30 64 110 / 18%);
}
.school-type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 2px 2px 10px;
  border-bottom: 1px solid #edf1f6;
}
.school-type-filters button {
  min-height: 32px;
  padding: 6px 11px;
  border: 1px solid #d5deeb;
  border-radius: 999px;
  color: #5f6f86;
  background: #fff;
  font-size: 12px;
  line-height: 1;
}
.school-type-filters button.selected {
  border-color: #1677ff;
  color: #1677ff;
  background: #f0f6ff;
  font-weight: 700;
}
.school-type-filters button:focus-visible {
  outline: 2px solid #b8d6ff;
  outline-offset: 1px;
}
.school-result {
  display: flex;
  width: 100%;
  padding: 11px 10px;
  border: 0;
  border-radius: 9px;
  flex-direction: column;
  gap: 4px;
  color: #172236;
  background: transparent;
  text-align: left;
}
.school-result:hover,
.school-result[aria-selected='true'] {
  background: #f0f6ff;
}
.school-options strong {
  font-size: 13px;
}
.school-options span,
.school-state {
  color: #718096;
  font-size: 12px;
}
.school-state {
  margin: 0;
  padding: 12px;
  text-align: center;
}
.school-state--error {
  color: #c03333;
}
.school-more {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  color: #1677ff;
  background: transparent;
  font-size: 12px;
}
.school-required {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
