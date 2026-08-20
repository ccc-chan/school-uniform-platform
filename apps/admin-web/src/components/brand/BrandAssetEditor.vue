<script setup lang="ts">
import { message } from 'ant-design-vue'
import type {
  BrandAsset,
  BrandAssetInput,
  BrandAssetType,
} from '@/api/brand'
import BrandMediaPreview from '@/components/brand/BrandMediaPreview.vue'
import type { ConfigFormField } from '@/components/common/types'

const props = defineProps<{
  open: boolean
  type: BrandAssetType
  item: BrandAsset | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: BrandAssetInput]
}>()

const form = reactive<BrandAssetInput>({
  title: '',
  subtitle: '',
  content: '',
  location: '',
  sort: 0,
  status: 'enabled',
  cover: null,
  media: null,
})

const labels = computed(() => {
  if (props.type === 'factory') {
    return {
      singular: '工厂展示',
      title: '工厂名称',
      subtitle: '展示亮点',
      content: '生产能力介绍',
    }
  }
  if (props.type === 'video') {
    return {
      singular: '视频资料',
      title: '视频标题',
      subtitle: '视频摘要',
      content: '视频说明',
    }
  }
  return {
    singular: '品牌故事',
    title: '故事标题',
    subtitle: '故事摘要',
    content: '故事正文',
  }
})

const formModel = computed<Record<string, unknown>>({
  get: () => form,
  set: value => Object.assign(form, value),
})

const fields = computed<ConfigFormField[]>(() => {
  const result: ConfigFormField[] = [
    {
      key: 'title',
      label: labels.value.title,
      type: 'input',
      required: true,
      placeholder: `请输入${labels.value.title}`,
      componentProps: { maxlength: 160 },
    },
    {
      key: 'subtitle',
      label: labels.value.subtitle,
      type: 'input',
      placeholder: `请输入${labels.value.subtitle}`,
      componentProps: { maxlength: 255 },
    },
  ]

  if (props.type === 'factory') {
    result.push({
      key: 'location',
      label: '所在地区',
      type: 'input',
      required: true,
      placeholder: '例如：江苏省苏州市',
      componentProps: { maxlength: 160 },
    })
  }

  result.push(
    {
      key: 'sort',
      label: '展示排序',
      type: 'number',
      componentProps: { min: 0, max: 9999 },
    },
    {
      key: 'content',
      label: labels.value.content,
      type: 'textarea',
      required: props.type !== 'video',
      span: 2,
      placeholder: `请输入${labels.value.content}`,
      componentProps: { rows: 5, maxlength: 10000, showCount: true },
    },
    {
      key: 'cover',
      label: '展示封面',
      type: 'input',
      span: 2,
    },
  )

  if (props.type === 'video') {
    result.push({
      key: 'media',
      label: '视频文件',
      type: 'input',
      required: true,
      span: 2,
    })
  }

  result.push({
    key: 'status',
    label: '展示状态',
    type: 'radio',
    span: 2,
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  })

  return result
})

watch(
  () => [props.open, props.type, props.item] as const,
  () => {
    if (!props.open) return
    Object.assign(form, {
      title: props.item?.title || '',
      subtitle: props.item?.subtitle || '',
      content: props.item?.content || '',
      location: props.item?.location || '',
      sort: props.item?.sort || 0,
      status: props.item?.status || 'enabled',
      cover: null,
      media: null,
    })
  },
  { immediate: true },
)

function selectCover(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    message.error('封面仅支持 JPG、PNG、WEBP 图片')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    message.error('封面图片不能超过 10MB')
    return false
  }
  form.cover = file
  return false
}

function selectMedia(file: File) {
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
    message.error('仅支持 MP4、WEBM、MOV 视频')
    return false
  }
  if (file.size > 200 * 1024 * 1024) {
    message.error('视频文件不能超过 200MB')
    return false
  }
  form.media = file
  return false
}

function submit() {
  if (!form.title.trim()) {
    message.warning(`请填写${labels.value.title}`)
    return
  }
  if (props.type === 'factory' && !form.location.trim()) {
    message.warning('请填写所在地区')
    return
  }
  if (props.type !== 'video' && !form.content.trim()) {
    message.warning(`请填写${labels.value.content}`)
    return
  }
  if (props.type === 'video' && !props.item?.mediaFileId && !form.media) {
    message.warning('请上传视频文件')
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <a-modal
    :open="open"
    :title="`${item ? '编辑' : '新增'}${labels.singular}`"
    :width="760"
    :confirm-loading="saving"
    wrap-class-name="responsive-modal"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <ConfigForm v-model="formModel" :fields="fields" :columns="2">
      <template #field-cover>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            v-if="item?.coverFileId && !form.cover"
            class="h-24 w-40 overflow-hidden rounded-2"
          >
            <BrandMediaPreview :file-id="item.coverFileId" :alt="item.title" />
          </div>
          <a-upload
            accept="image/jpeg,image/png,image/webp"
            :before-upload="selectCover"
            :show-upload-list="false"
          >
            <a-button>{{ item?.coverFileId ? '更换封面' : '选择封面' }}</a-button>
          </a-upload>
          <span class="text-xs text-slate-400">
            {{ form.cover?.name || 'JPG、PNG、WEBP，不超过 10MB' }}
          </span>
        </div>
      </template>

      <template #field-media>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a-upload
            accept="video/mp4,video/webm,video/quicktime,.mov"
            :before-upload="selectMedia"
            :show-upload-list="false"
          >
            <a-button>{{ item?.mediaFileId ? '更换视频' : '选择视频' }}</a-button>
          </a-upload>
          <span class="text-xs text-slate-400">
            {{ form.media?.name || item?.mediaFileName || 'MP4、WEBM、MOV，不超过 200MB' }}
          </span>
        </div>
      </template>
    </ConfigForm>
  </a-modal>
</template>
