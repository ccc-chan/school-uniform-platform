<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { ProductionInput, ProductionItem } from '@/api/production'
import type { ConfigFormField } from '@/components/common/types'

const props = defineProps<{
  open: boolean
  title: string
  item: ProductionItem | null
  fields: ConfigFormField[]
  defaults: ProductionInput
  saving: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: ProductionInput]
}>()

const form = shallowRef<ProductionInput>({})
const formModel = computed<Record<string, unknown>>({
  get: () => form.value,
  set: (value) => { form.value = value },
})

watch(
  () => [props.open, props.item, props.defaults] as const,
  () => {
    if (!props.open) return
    form.value = {
      ...props.defaults,
      ...Object.fromEntries(
        props.fields.map((field) => [
          field.key,
          props.item?.[field.key as keyof ProductionItem]
            ?? props.defaults[field.key],
        ]),
      ),
    }
  },
  { immediate: true },
)

function submit() {
  const missing = props.fields.find(
    (field) => field.required && (form.value[field.key] === '' || form.value[field.key] == null),
  )
  if (missing) {
    message.warning(`请填写${missing.label}`)
    return
  }
  emit('submit', { ...form.value })
}
</script>

<template>
  <a-modal
    :open="open"
    :title="item ? `编辑${title}` : `新增${title}`"
    :width="720"
    :confirm-loading="saving"
    wrap-class-name="responsive-modal"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" :columns="2" />
  </a-modal>
</template>
