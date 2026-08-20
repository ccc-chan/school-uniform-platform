<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  createBrandAsset,
  deleteBrandAsset,
  getBrandAssets,
  updateBrandAsset,
  updateBrandAssetStatus,
  type BrandAsset,
  type BrandAssetInput,
  type BrandAssetStatus,
  type BrandAssetType,
} from '@/api/brand'
import BrandAssetEditor from '@/components/brand/BrandAssetEditor.vue'
import BrandAssetTable from '@/components/brand/BrandAssetTable.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const items = shallowRef<BrandAsset[]>([])
const loading = shallowRef(false)
const saving = shallowRef(false)
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const filters = reactive({ keyword: '', status: '' })
const editorOpen = shallowRef(false)
const current = shallowRef<BrandAsset | null>(null)

const assetType = computed(
  () => String(route.meta.brandAssetType || 'story') as BrandAssetType,
)
const pageConfig = computed(() => {
  if (assetType.value === 'factory') {
    return {
      title: '工厂展示管理',
      description: '展示生产工厂、所在地区、制造能力与环境形象',
      addLabel: '新增工厂展示',
      permission: 'brand.factory.manage',
      placeholder: '工厂名称、地区或生产能力',
    }
  }
  if (assetType.value === 'video') {
    return {
      title: '视频资料管理',
      description: '维护品牌宣传、生产过程和质量展示视频',
      addLabel: '上传品牌视频',
      permission: 'brand.video.manage',
      placeholder: '视频标题、摘要或说明',
    }
  }
  return {
    title: '品牌故事管理',
    description: '维护品牌理念、发展历程与校园服务故事',
    addLabel: '新增品牌故事',
    permission: 'brand.story.manage',
    placeholder: '故事标题、摘要或正文',
  }
})
const canManage = computed(() => auth.hasPermission(pageConfig.value.permission))

async function load() {
  loading.value = true
  try {
    const result = await getBrandAssets(assetType.value, {
      ...filters,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = result.items
    total.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '品牌内容加载失败')
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  Object.assign(filters, { keyword: '', status: '' })
  page.value = 1
  load()
}

function openEditor(item: BrandAsset | null = null) {
  current.value = item
  editorOpen.value = true
}

async function save(value: BrandAssetInput) {
  saving.value = true
  try {
    if (current.value) {
      await updateBrandAsset(assetType.value, current.value.id, value)
    } else {
      await createBrandAsset(assetType.value, value)
    }
    editorOpen.value = false
    message.success('品牌内容保存成功')
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '品牌内容保存失败')
  } finally {
    saving.value = false
  }
}

async function changeStatus(item: BrandAsset, status: BrandAssetStatus) {
  try {
    await updateBrandAssetStatus(assetType.value, item.id, status)
    message.success('状态已更新')
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '状态更新失败')
  }
}

async function remove(item: BrandAsset) {
  try {
    await deleteBrandAsset(assetType.value, item.id)
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    message.success('品牌内容已删除')
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '品牌内容删除失败')
  }
}

watch(
  assetType,
  () => {
    Object.assign(filters, { keyword: '', status: '' })
    page.value = 1
    current.value = null
    editorOpen.value = false
    load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="mx-auto max-w-400 space-y-4">
    <div class="page-card">
      <PageHeader
        :title="pageConfig.title"
        :description="pageConfig.description"
      >
        <template v-if="canManage" #actions>
          <a-button type="primary" @click="openEditor()">
            {{ pageConfig.addLabel }}
          </a-button>
        </template>
      </PageHeader>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a-input
          v-model:value="filters.keyword"
          allow-clear
          class="w-full sm:w-80"
          :placeholder="pageConfig.placeholder"
          @press-enter="search"
        />
        <a-select
          v-model:value="filters.status"
          class="w-full sm:w-40"
          :options="[
            { label: '全部状态', value: '' },
            { label: '启用', value: 'enabled' },
            { label: '停用', value: 'disabled' },
          ]"
        />
        <a-space>
          <a-button type="primary" :loading="loading" @click="search">查询</a-button>
          <a-button :disabled="loading" @click="reset">重置</a-button>
        </a-space>
      </div>
    </div>

    <div class="page-card overflow-hidden">
      <BrandAssetTable
        :type="assetType"
        :items="items"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :can-manage="canManage"
        @edit="openEditor"
        @status="changeStatus"
        @delete="remove"
        @page-change="page = $event; load()"
      />
    </div>

    <BrandAssetEditor
      v-model:open="editorOpen"
      :type="assetType"
      :item="current"
      :saving="saving"
      @submit="save"
    />
  </section>
</template>
