<script setup lang="ts">
import { message } from 'ant-design-vue'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  batchNo: string
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [content: string]
}>()

const content = shallowRef('')

function submit() {
  const value = content.value.trim()
  if (!value) {
    message.warning('请输入环节内容')
    return
  }
  emit('submit', value)
}

watch(open, (value) => {
  if (value) content.value = ''
})
</script>

<template>
  <a-modal
    v-model:open="open"
    title="添加生产环节"
    ok-text="确认添加"
    cancel-text="取消"
    :width="520"
    :confirm-loading="props.submitting"
    :closable="!props.submitting"
    :mask-closable="!props.submitting"
    @ok="submit"
  >
    <a-form layout="vertical" class="production-step-modal__form">
      <a-form-item label="环节内容" required>
        <a-textarea
          v-model:value="content"
          :maxlength="200"
          show-count
          :auto-size="{ minRows: 4, maxRows: 6 }"
          placeholder="请输入生产环节内容，例如：包装入库"
          @press-enter.stop
        />
      </a-form-item>
      <p class="production-step-modal__hint">
        添加后将显示在当前批次 {{ props.batchNo }} 的生产流程中
      </p>
    </a-form>
  </a-modal>
</template>

<style scoped>
.production-step-modal__form{padding-top:10px}.production-step-modal__hint{margin:-8px 0 2px;color:#94a3b8;font-size:12px}
</style>
