<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  getBrandProfile,
  updateBrandProfile,
  type BrandProfile,
  type BrandProfileInput,
} from '@/api/brand'
import BrandProfileForm, {
  type BrandProfileVisibleFields,
} from '@/components/brand/BrandProfileForm.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const profile = shallowRef<BrandProfile | null>(null)
const loading = shallowRef(false)
const saving = shallowRef(false)

const canManage = computed(() => auth.hasPermission('brand.profile.manage'))
const visibleFields = computed<BrandProfileVisibleFields>(() => ({
  name: auth.hasPermission('brand.field.name'),
  logo: auth.hasPermission('brand.field.logo'),
  introduction: auth.hasPermission('brand.field.introduction'),
  website: auth.hasPermission('brand.field.website'),
  phone: auth.hasPermission('brand.field.phone'),
}))
const hasVisibleFields = computed(() =>
  Object.values(visibleFields.value).some(Boolean),
)

async function load() {
  loading.value = true
  try {
    profile.value = await getBrandProfile()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '品牌资料加载失败')
  } finally {
    loading.value = false
  }
}

async function save(value: BrandProfileInput) {
  saving.value = true
  try {
    profile.value = await updateBrandProfile(value)
    message.success('品牌资料保存成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '品牌资料保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-360 space-y-4">
    <div class="page-card">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="page-title">品牌资料管理</h2>
          <p class="mb-0 mt-2 text-secondary">
            维护品牌名称、Logo、介绍、官方网站及联系电话
          </p>
        </div>
        <span class="text-xs text-slate-400">
          最近更新：{{ profile?.updatedAt || '-' }}
        </span>
      </div>
    </div>

    <div class="page-card min-h-80">
      <div v-if="loading" class="h-64 flex items-center justify-center">
        <a-spin tip="品牌资料加载中" />
      </div>
      <BrandProfileForm
        v-else-if="hasVisibleFields"
        :profile="profile"
        :visible-fields="visibleFields"
        :saving="saving"
        :can-manage="canManage"
        @submit="save"
      />
      <a-empty v-else description="当前角色没有可查看的品牌资料字段" />
    </div>
  </section>
</template>
