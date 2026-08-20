<script setup lang="ts">
import type { ConfigFormField } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, unknown>
    fields: ConfigFormField[]
    columns?: 1 | 2
    layout?: 'horizontal' | 'vertical' | 'inline'
  }>(),
  {
    columns: 1,
    layout: 'vertical',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function updateField(key: string, value: unknown) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function getScalarValue(key: string) {
  return props.modelValue[key] as string | number | undefined
}

function getSelectValue(key: string) {
  return props.modelValue[key] as
    | string
    | number
    | Array<string | number>
    | undefined
}

function getArrayValue(key: string) {
  return props.modelValue[key] as Array<string | number> | undefined
}

function getBooleanValue(key: string) {
  return Boolean(props.modelValue[key])
}
</script>

<template>
  <a-form
    :model="modelValue"
    :layout="layout"
    validate-trigger="blur"
    :validate-messages="{ required: '请填写${label}' }"
    class="config-form"
    :class="{ 'config-form--two-columns': columns === 2 }"
  >
    <a-form-item
      v-for="field in fields"
      :key="field.key"
      :name="field.name ?? field.key"
      :label="field.label"
      :required="field.required"
      :class="[
        field.itemClass,
        { 'config-form__item--full': field.span === 2 },
      ]"
    >
      <slot
        :name="`field-${field.key}`"
        :field="field"
        :value="modelValue[field.key]"
        :update="(value: unknown) => updateField(field.key, value)"
      >
        <a-input
          v-if="field.type === 'input'"
          :value="getScalarValue(field.key)"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-input-password
          v-else-if="field.type === 'password'"
          :value="getScalarValue(field.key)"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-input-number
          v-else-if="field.type === 'number'"
          :value="getScalarValue(field.key) as number | undefined"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          class="w-full"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-input
          v-else-if="field.type === 'date'"
          type="date"
          :value="getScalarValue(field.key)"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-textarea
          v-else-if="field.type === 'textarea'"
          :value="getScalarValue(field.key)"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-select
          v-else-if="field.type === 'select'"
          :value="getSelectValue(field.key)"
          :options="field.options"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-radio-group
          v-else-if="field.type === 'radio'"
          :value="getScalarValue(field.key)"
          :options="field.options"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-checkbox-group
          v-else-if="field.type === 'checkbox'"
          :value="getArrayValue(field.key)"
          :options="field.options"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:value="updateField(field.key, $event)"
        />

        <a-switch
          v-else
          :checked="getBooleanValue(field.key)"
          :disabled="field.disabled"
          v-bind="field.componentProps"
          @update:checked="updateField(field.key, $event)"
        />
      </slot>
    </a-form-item>

    <slot />
  </a-form>
</template>

<style scoped>
.config-form--two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.config-form__item--full {
  grid-column: 1 / -1;
}

@media (max-width: 639px) {
  .config-form--two-columns {
    grid-template-columns: 1fr;
  }

  .config-form__item--full {
    grid-column: auto;
  }
}
</style>
