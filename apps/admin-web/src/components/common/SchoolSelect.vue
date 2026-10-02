<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import {
  getSchools,
  schoolTypeOptions,
  type SchoolOption,
  type SchoolType,
} from '@/api/schools'

const props = withDefaults(
  defineProps<{
    multiple?: boolean
    initialOptions?: SchoolOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    multiple: false,
    initialOptions: () => [],
    placeholder: '输入学校名称搜索',
    disabled: false,
  },
)
const model = defineModel<number | number[] | undefined>({ required: true })
const options = shallowRef<SchoolOption[]>([])
const schoolType = shallowRef<SchoolType | ''>('')
const keyword = shallowRef('')
const page = shallowRef(0)
const hasMore = shallowRef(true)
const loading = shallowRef(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let sequence = 0

function merge(items: SchoolOption[], replace: boolean) {
  const source = replace
    ? [...props.initialOptions, ...items]
    : [...options.value, ...items]
  options.value = [...new Map(source.map((item) => [item.id, item])).values()]
}

async function load(nextPage: number, replace = false) {
  if (!replace && (loading.value || !hasMore.value)) return
  const current = ++sequence
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  try {
    const result = await getSchools(
      keyword.value,
      schoolType.value,
      nextPage,
      20,
      controller.signal,
    )
    if (current !== sequence) return
    merge(result.items, replace)
    page.value = result.page
    hasMore.value = result.hasMore
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      message.error(error instanceof Error ? error.message : '学校列表加载失败')
    }
  } finally {
    if (current === sequence) loading.value = false
  }
}

function search(value: string) {
  keyword.value = value.trim()
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void load(1, true), 250)
}

function changeSchoolType(value: unknown) {
  schoolType.value = schoolTypeOptions.includes(value as SchoolType)
    ? (value as SchoolType)
    : ''
  keyword.value = ''
  page.value = 0
  hasMore.value = true
  void load(1, true)
}

function openChanged(open: boolean) {
  if (open && page.value === 0) void load(1, true)
}

function popupScroll(event: Event) {
  const target = event.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
    void load(page.value + 1)
  }
}

watch(
  () => props.initialOptions,
  (items) => merge(items, false),
  {
    immediate: true,
    deep: true,
  },
)

onBeforeUnmount(() => {
  controller?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="school-select">
    <label class="school-select__field">
      <span>学校类型</span>
      <a-select
        :value="schoolType || undefined"
        :disabled="disabled"
        :options="schoolTypeOptions.map((value) => ({ label: value, value }))"
        allow-clear
        placeholder="请选择学校类型"
        @change="changeSchoolType"
      />
    </label>
    <label class="school-select__field">
      <span>学校名称</span>
      <a-select
        v-model:value="model"
        :mode="multiple ? 'multiple' : undefined"
        :disabled="disabled"
        :loading="loading"
        :placeholder="schoolType ? `搜索${schoolType}学校` : placeholder"
        :filter-option="false"
        :options="options.map((item) => ({ value: item.id, label: item.name }))"
        allow-clear
        show-search
        @search="search"
        @dropdown-visible-change="openChanged"
        @popup-scroll="popupScroll"
      />
    </label>
  </div>
</template>

<style scoped>
.school-select {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  width: 100%;
  gap: 10px;
}

.school-select__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.school-select__field > span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 639px) {
  .school-select {
    grid-template-columns: 1fr;
  }
}
</style>
