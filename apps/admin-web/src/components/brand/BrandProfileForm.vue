<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { BrandProfile, BrandProfileInput } from '@/api/brand'
import BrandMediaPreview from '@/components/brand/BrandMediaPreview.vue'
import type { ConfigFormField } from '@/components/common/types'

export interface BrandProfileVisibleFields {
  name: boolean
  logo: boolean
  introduction: boolean
  website: boolean
  phone: boolean
}

const props = defineProps<{
  profile: BrandProfile | null
  visibleFields: BrandProfileVisibleFields
  saving: boolean
  canManage: boolean
}>()

const emit = defineEmits<{
  submit: [value: BrandProfileInput]
}>()

const form = reactive<BrandProfileInput>({
  name: '',
  introduction: '',
  website: '',
  phone: '',
  logo: null,
})

const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: value => Object.assign(form, value),
})

const fields = computed<ConfigFormField[]>(() => {
  const result: ConfigFormField[] = []

  if (props.visibleFields.name) {
    result.push({
      key: 'name',
      label: '品牌名称',
      type: 'input',
      required: true,
      disabled: !props.canManage,
      placeholder: '请输入品牌名称',
      componentProps: { maxlength: 120 },
    })
  }

  if (props.visibleFields.website) {
    result.push({
      key: 'website',
      label: '官方网站',
      type: 'input',
      disabled: !props.canManage,
      placeholder: 'https://example.com',
      componentProps: { maxlength: 255 },
    })
  }

  if (props.visibleFields.phone) {
    result.push({
      key: 'phone',
      label: '联系电话',
      type: 'input',
      disabled: !props.canManage,
      placeholder: '请输入联系电话',
      componentProps: { maxlength: 30 },
    })
  }

  if (props.visibleFields.introduction) {
    result.push({
      key: 'introduction',
      label: '品牌介绍',
      type: 'textarea',
      required: true,
      disabled: !props.canManage,
      span: 2,
      placeholder: '介绍品牌理念、历史与服务特色',
      componentProps: { rows: 8, maxlength: 5000, showCount: true },
    })
  }

  return result
})

watch(
  () => props.profile,
  (profile) => {
    Object.assign(form, {
      name: profile?.name || '',
      introduction: profile?.introduction || '',
      website: profile?.website || '',
      phone: profile?.phone || '',
      logo: null,
    })
  },
  { immediate: true },
)

function selectLogo(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    message.error('Logo 仅支持 JPG、PNG、WEBP 图片')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    message.error('Logo 图片不能超过 10MB')
    return false
  }
  form.logo = file
  return false
}

function submit() {
  if (props.visibleFields.name && !form.name.trim()) {
    message.warning('请填写品牌名称')
    return
  }
  if (props.visibleFields.introduction && !form.introduction.trim()) {
    message.warning('请填写品牌介绍')
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <div
    class="brand-profile-form"
    :class="{ 'brand-profile-form--without-logo': !visibleFields.logo }"
  >
    <div v-if="visibleFields.logo" class="brand-profile-form__logo-panel">
      <div class="brand-profile-form__logo">
        <BrandMediaPreview
          v-if="profile?.logoFileId && !form.logo"
          :file-id="profile.logoFileId"
          :alt="profile.name || '品牌 Logo'"
        />
        <div v-else class="px-4 text-center text-sm text-slate-400">
          {{ form.logo ? form.logo.name : '尚未上传 Logo' }}
        </div>
      </div>
      <a-upload
        v-if="canManage"
        accept="image/jpeg,image/png,image/webp"
        :before-upload="selectLogo"
        :show-upload-list="false"
      >
        <a-button>{{ profile?.logoFileId ? '更换 Logo' : '上传 Logo' }}</a-button>
      </a-upload>
      <p class="mb-0 text-xs text-slate-400">JPG、PNG、WEBP，不超过 10MB</p>
    </div>

    <ConfigForm
      v-model="formModel"
      class="brand-profile-form__fields"
      :fields="fields"
      :columns="2"
    >
      <div v-if="canManage" class="brand-profile-form__actions">
        <a-button type="primary" :loading="saving" @click="submit">
          保存品牌资料
        </a-button>
      </div>
    </ConfigForm>
  </div>
</template>

<style scoped>
.brand-profile-form {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 32px;
}

.brand-profile-form--without-logo {
  grid-template-columns: minmax(0, 1fr);
}

.brand-profile-form__logo-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.brand-profile-form__logo {
  display: flex;
  width: 180px;
  height: 180px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
}

.brand-profile-form__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.brand-profile-form__actions {
  grid-column: 1 / -1;
}

.brand-profile-form__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .brand-profile-form {
    grid-template-columns: 1fr;
  }

  .brand-profile-form__fields {
    grid-template-columns: 1fr;
  }

  .brand-profile-form__actions {
    grid-column: auto;
  }
}
</style>
