<script setup lang="ts">
import { message } from 'ant-design-vue'
import type {
  QualityConclusion,
  QualityInspectionItem,
  QualityResultInput,
} from '@/api/quality'
import ConfigTable from '@/components/common/ConfigTable.vue'
import type { ConfigTableColumn } from '@/components/common/types'

const props = defineProps<{
  definitions: QualityInspectionItem[]
}>()

const model = defineModel<QualityResultInput[]>({ required: true })

const selectedItemId = shallowRef<number | undefined>()

const columns: ConfigTableColumn[] = [
  { title: '检测项目', key: 'item', width: 210 },
  { title: '标准要求', key: 'standard', width: 250 },
  { title: '检测结果', key: 'result', width: 180 },
  { title: '结论', key: 'conclusion', width: 120 },
  { title: '备注', key: 'remark', width: 180 },
  { title: '操作', key: 'actions', width: 70 },
]

const availableItemOptions = computed(() => {
  const selectedIds = new Set(model.value.map(item => item.itemId))
  return props.definitions
    .filter(item => !selectedIds.has(item.id))
    .map(item => ({
      label: `${item.category} · ${item.name}`,
      value: item.id,
    }))
})

const tableItems = computed(
  () => model.value as unknown as Record<string, unknown>[],
)

function itemDefinition(itemId: number) {
  return props.definitions.find(item => item.id === itemId)
}

function resultRow(record: Record<string, unknown>) {
  return record as unknown as QualityResultInput
}

function addResultItem() {
  if (!selectedItemId.value) {
    message.warning('请先选择检测项目')
    return
  }

  model.value = [
    ...model.value,
    {
      itemId: selectedItemId.value,
      resultValue: '',
      conclusion: 'qualified',
      remark: '',
    },
  ]
  selectedItemId.value = undefined
}

function removeResultItem(index: number) {
  model.value = model.value.filter((_, current) => current !== index)
}

function updateResult<Key extends 'resultValue' | 'conclusion' | 'remark'>(
  index: number,
  key: Key,
  value: QualityResultInput[Key],
) {
  model.value = model.value.map((item, current) =>
    current === index ? { ...item, [key]: value } : item,
  )
}

function updateConclusion(index: number, value: unknown) {
  if (value === 'qualified' || value === 'unqualified') {
    updateResult(index, 'conclusion', value as QualityConclusion)
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row">
      <a-select
        v-model:value="selectedItemId"
        :options="availableItemOptions"
        show-search
        option-filter-prop="label"
        class="min-w-0 flex-1"
        placeholder="选择检测项目"
      />
      <a-button
        :disabled="!availableItemOptions.length"
        @click="addResultItem"
      >
        添加项目
      </a-button>
    </div>

    <ConfigTable
      :columns="columns"
      :items="tableItems"
      row-key="itemId"
      size="small"
      :scroll-x="1000"
    >
      <template #cell="{ column, record, index }">
        <div v-if="column.key === 'item'">
          <div class="font-600 text-slate-900">
            {{ itemDefinition(resultRow(record).itemId)?.name }}
          </div>
          <div class="mt-1 text-xs text-slate-400">
            {{ itemDefinition(resultRow(record).itemId)?.code }} ·
            {{ itemDefinition(resultRow(record).itemId)?.category }}
          </div>
        </div>

        <span v-else-if="column.key === 'standard'">
          {{ itemDefinition(resultRow(record).itemId)?.standardRequirement }}
        </span>

        <a-input
          v-else-if="column.key === 'result'"
          :value="resultRow(record).resultValue"
          :addon-after="itemDefinition(resultRow(record).itemId)?.unit || undefined"
          placeholder="填写检测值"
          @update:value="updateResult(index, 'resultValue', String($event))"
        />

        <a-select
          v-else-if="column.key === 'conclusion'"
          :value="resultRow(record).conclusion"
          class="w-full"
          :options="[
            { label: '合格', value: 'qualified' },
            { label: '不合格', value: 'unqualified' },
          ]"
          @update:value="updateConclusion(index, $event)"
        />

        <a-input
          v-else-if="column.key === 'remark'"
          :value="resultRow(record).remark"
          :maxlength="300"
          placeholder="选填"
          @update:value="updateResult(index, 'remark', String($event))"
        />

        <a-button
          v-else-if="column.key === 'actions'"
          type="link"
          danger
          size="small"
          @click="removeResultItem(index)"
        >
          移除
        </a-button>
      </template>

      <template #empty>
        <a-empty description="请添加检测项目" />
      </template>
    </ConfigTable>
  </div>
</template>
