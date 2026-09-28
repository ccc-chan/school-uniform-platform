<script setup lang="ts">
import message from 'ant-design-vue/es/message'
import { createCompany, updateCompany, type Company, type CompanyInput } from '@/api/companies'

const props = defineProps<{ open: boolean; company: Company | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const saving = shallowRef(false)
const empty = (): CompanyInput => ({ name: '', englishName: '', creditCode: '', legalRepresentative: '', industry: '', region: '', address: '', contactPhone: '', license: null })
const form = reactive<CompanyInput>(empty())
const isEdit = computed(() => Boolean(props.company))
watch(() => [props.open, props.company] as const, ([open, company]) => {
  if (!open) return
  Object.assign(form, empty(), company ? { name: company.name, englishName: company.englishName, creditCode: company.creditCode, legalRepresentative: company.legalRepresentative, industry: company.industry, region: company.region, address: company.address, contactPhone: company.contactPhone } : {})
})
function beforeUpload(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { message.error('营业执照仅支持 JPG、PNG、WEBP'); return false }
  if (file.size > 10 * 1024 * 1024) { message.error('营业执照图片不能超过 10MB'); return false }
  form.license = file
  return false
}
async function submit() {
  if (!form.name.trim() || !form.creditCode.trim() || !form.legalRepresentative.trim() || !form.address.trim() || !form.contactPhone.trim()) { message.warning('请完整填写公司必填信息'); return }
  if (!/^[0-9A-Z]{18}$/.test(form.creditCode.trim().toUpperCase())) { message.warning('统一社会信用代码应为18位数字或大写字母'); return }
  saving.value = true
  try {
    const payload = { ...form, creditCode: form.creditCode.trim().toUpperCase() }
    if (props.company) await updateCompany(props.company.id, payload); else await createCompany(payload)
    message.success(props.company ? '公司已更新' : '公司已创建'); emit('saved')
  } catch (error) { message.error(error instanceof Error ? error.message : '保存失败') }
  finally { saving.value = false }
}
</script>

<template>
  <a-drawer :open="open" width="min(620px, 100vw)" :title="isEdit ? '修改公司' : '新增公司'" @close="emit('close')">
    <div class="company-editor">
      <label><span>公司名称 *</span><a-input v-model:value="form.name" placeholder="请输入公司名称" /></label>
      <label><span>公司英文名称</span><a-input v-model:value="form.englishName" placeholder="请输入英文名称" /></label>
      <label><span>统一社会信用代码 *</span><a-input v-model:value="form.creditCode" :maxlength="18" placeholder="18位统一社会信用代码" /></label>
      <label><span>法人名称 *</span><a-input v-model:value="form.legalRepresentative" placeholder="请输入法人姓名" /></label>
      <label><span>所属行业</span><a-input v-model:value="form.industry" placeholder="如：纺织服装制造" /></label>
      <label><span>所属地区</span><a-input v-model:value="form.region" placeholder="如：广东省 / 茂名市 / 高州市" /></label>
      <label class="company-editor__full"><span>详细地址 *</span><a-input v-model:value="form.address" placeholder="请输入详细地址" /></label>
      <label><span>联系电话 *</span><a-input v-model:value="form.contactPhone" placeholder="请输入联系电话" /></label>
      <label><span>营业执照</span><a-upload :before-upload="beforeUpload" :show-upload-list="false" accept="image/jpeg,image/png,image/webp"><a-button>{{ form.license ? form.license.name : company?.licenseFileId ? '重新上传' : '选择图片' }}</a-button></a-upload></label>
    </div>
    <template #footer><div class="company-editor__footer"><a-button @click="emit('close')">取消</a-button><a-button type="primary" :loading="saving" @click="submit">保存</a-button></div></template>
  </a-drawer>
</template>

<style scoped>.company-editor{display:grid;grid-template-columns:1fr 1fr;gap:18px}.company-editor label{display:flex;flex-direction:column;gap:7px}.company-editor label>span{color:#475569;font-size:13px;font-weight:600}.company-editor__full{grid-column:1/-1}.company-editor__footer{display:flex;justify-content:flex-end;gap:10px}@media(max-width:600px){.company-editor{grid-template-columns:1fr}.company-editor__full{grid-column:auto}}</style>
