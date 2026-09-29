<script setup lang="ts">
import { InboxOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { CascaderProps } from 'ant-design-vue'
import message from 'ant-design-vue/es/message'
import { pcaTextArr } from 'element-china-area-data'
import { checkCompanyCode, createCompany, getCompanyLogo, updateCompany, type Company, type CompanyInput } from '@/api/companies'

const props = defineProps<{ open: boolean; company: Company | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const saving = shallowRef(false)
const checkingCode = shallowRef(false)
const codeExists = shallowRef(false)
const regionPath = shallowRef<string[]>([])
const logoPreviewUrl = shallowRef('')
const companyImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const empty = (): CompanyInput => ({ code: '', name: '', brandName: '', creditCode: '', legalRepresentative: '', region: '', address: '', contactPhone: '', introduction: '', logo: null, license: null })
const form = reactive<CompanyInput>(empty())
const isEdit = computed(() => Boolean(props.company))
let codeCheckTimer: ReturnType<typeof setTimeout> | undefined
let codeCheckSequence = 0
function clearLogoPreview() {
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value)
  logoPreviewUrl.value = ''
}
watch(() => [props.open, props.company] as const, async ([open, company]) => {
  if (!open) return
  if (codeCheckTimer) clearTimeout(codeCheckTimer)
  codeExists.value = false
  checkingCode.value = false
  clearLogoPreview()
  Object.assign(form, empty(), company ? { code: company.code, name: company.name, brandName: company.brandName, creditCode: company.creditCode, legalRepresentative: company.legalRepresentative, region: company.region, address: company.address, contactPhone: company.contactPhone, introduction: company.introduction } : {})
  regionPath.value = form.region ? form.region.split(/\s*\/\s*/) : []
  if (company?.logoFileId) {
    try { logoPreviewUrl.value = URL.createObjectURL(await getCompanyLogo(company.id)) }
    catch { logoPreviewUrl.value = '' }
  }
})
onBeforeUnmount(() => {
  clearLogoPreview()
  if (codeCheckTimer) clearTimeout(codeCheckTimer)
})
type CascaderValue = Parameters<NonNullable<CascaderProps['onChange']>>[0]

function handleRegionChange(value: CascaderValue) {
  const path = value.flat().map(String)
  regionPath.value = path
  form.region = path.join(' / ')
}
function handleLogoSelected(file: File) {
  clearLogoPreview()
  logoPreviewUrl.value = URL.createObjectURL(file)
}
function handleCompanyCode(value: string) {
  form.code = value.toUpperCase().replace(/[^A-Z]/g, '')
  if (codeCheckTimer) clearTimeout(codeCheckTimer)
  codeExists.value = false
  const code = form.code
  if (!/^[A-Z]{2,32}$/.test(code)) return

  const sequence = ++codeCheckSequence
  codeCheckTimer = setTimeout(async () => {
    checkingCode.value = true
    try {
      const result = await checkCompanyCode(code, props.company?.id)
      if (sequence === codeCheckSequence && code === form.code) {
        codeExists.value = result.exists
      }
    } catch (error) {
      if (sequence === codeCheckSequence) {
        message.error(error instanceof Error ? error.message : '公司编码检查失败')
      }
    } finally {
      if (sequence === codeCheckSequence) checkingCode.value = false
    }
  }, 300)
}
async function submit() {
  if (!form.code.trim() || !form.name.trim() || !form.creditCode.trim() || !form.legalRepresentative.trim() || !form.region.trim() || !form.address.trim() || !form.contactPhone.trim()) { message.warning('请完整填写公司必填信息'); return }
  if (!props.company && !form.license) { message.warning('请上传营业执照'); return }
  if (!/^[A-Z]{2,32}$/.test(form.code)) { message.warning('公司编码应为 2～32 位大写英文字母'); return }
  if (checkingCode.value || codeExists.value) { message.warning(checkingCode.value ? '正在检查公司编码，请稍候' : '公司编码已存在'); return }
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
  <a-drawer
    :open="open"
    width="min(720px, 100vw)"
    @close="emit('close')"
  >
    <template #title>
      <div class="company-editor__drawer-title">
        <span class="company-editor__title-mark">企</span>
        <div>
          <strong>{{ isEdit ? '编辑企业档案' : '新增企业档案' }}</strong>
          <small>{{ isEdit ? '更新企业主体、资质与地址信息' : '录入企业主体、资质与地址信息' }}</small>
        </div>
      </div>
    </template>

    <div class="company-editor">
      <section class="company-editor__section">
        <header class="company-editor__section-header">
          <div>
            <h3>主体信息</h3>
            <p>填写企业工商登记及联系方式</p>
          </div>
          <span>基本资料</span>
        </header>

        <div class="company-editor__grid">
          <label class="company-editor__field">
            <span>公司编码 <em>*</em></span>
            <a-input
              :value="form.code"
              :maxlength="32"
              :status="codeExists ? 'error' : undefined"
              placeholder="请输入公司编码"
              @update:value="handleCompanyCode(String($event))"
            />
            <small v-if="checkingCode">正在检查编码...</small>
            <small v-else-if="codeExists" class="company-editor__field-error">公司编码已存在</small>
            <small v-else>仅支持大写英文字母，输入小写将自动转为大写</small>
          </label>

          <label class="company-editor__field company-editor__field--full">
            <span>企业名称 <em>*</em></span>
            <a-input v-model:value="form.name" placeholder="请输入营业执照上的企业名称" />
          </label>

          <label class="company-editor__field">
            <span>品牌名称</span>
            <a-input v-model:value="form.brandName" placeholder="请输入品牌名称（选填）" />
          </label>

          <label class="company-editor__field">
            <span>统一社会信用代码 <em>*</em></span>
            <a-input
              v-model:value="form.creditCode"
              :maxlength="18"
              placeholder="18位数字或大写字母"
            />
          </label>

          <label class="company-editor__field">
            <span>企业法人 <em>*</em></span>
            <a-input v-model:value="form.legalRepresentative" placeholder="请输入法人姓名" />
          </label>

          <label class="company-editor__field company-editor__field--full">
            <span>企业联系电话 <em>*</em></span>
            <a-input v-model:value="form.contactPhone" placeholder="请输入企业联系电话" />
          </label>
        </div>

        <div class="company-editor__profile-grid">
          <label class="company-editor__field">
            <span>品牌 Logo</span>
            <FileUpload
              v-model:file="form.logo"
              mode="custom"
              :auto-upload="false"
              :allowed-types="companyImageTypes"
              accept="image/jpeg,image/png,image/webp"
              :max-size-mb="2"
              invalid-type-message="品牌 Logo 仅支持 JPG、PNG、WEBP"
              @select="handleLogoSelected"
            >
              <span class="company-editor__logo-upload">
                <img v-if="logoPreviewUrl" :src="logoPreviewUrl" alt="品牌 Logo 预览" />
                <PlusOutlined v-else />
              </span>
            </FileUpload>
            <small>建议上传正方形图片，支持 JPG、PNG、WEBP，最大 2MB</small>
          </label>

          <label class="company-editor__field">
            <span>企业介绍</span>
            <a-textarea v-model:value="form.introduction" :maxlength="2000" :rows="5" show-count placeholder="请输入企业介绍（选填）" />
          </label>
        </div>
      </section>

      <section class="company-editor__section">
        <header class="company-editor__section-header">
          <div>
            <h3>资质文件</h3>
            <p>上传清晰、完整且在有效期内的营业执照</p>
          </div>
          <span>JPG / PNG / WEBP</span>
        </header>

        <label class="company-editor__upload-label">
          营业执照 <em v-if="!company?.licenseFileId">*</em>
        </label>
        <FileUpload
          v-model:file="form.license"
          mode="custom"
          dragger
          :auto-upload="false"
          :allowed-types="companyImageTypes"
          accept="image/jpeg,image/png,image/webp"
          :max-size-mb="10"
          invalid-type-message="营业执照仅支持 JPG、PNG、WEBP"
        >
          <div class="company-editor__upload">
            <span class="company-editor__upload-icon">
              <InboxOutlined />
            </span>
            <div>
              <strong>
                {{
                  form.license
                    ? form.license.name
                    : company?.licenseFileId
                      ? '已上传营业执照'
                      : '点击或拖拽上传营业执照'
                }}
              </strong>
              <p>
                {{
                  form.license || company?.licenseFileId
                    ? '点击此区域可重新选择文件'
                    : '支持 JPG、PNG、WEBP，文件不超过 10MB'
                }}
              </p>
            </div>
          </div>
        </FileUpload>
      </section>

      <section class="company-editor__section">
        <header class="company-editor__section-header">
          <div>
            <h3>企业地址</h3>
            <p>选择行政区域并补充具体门牌地址</p>
          </div>
          <span>经营地址</span>
        </header>

        <div class="company-editor__grid">
          <label class="company-editor__field company-editor__field--full">
            <span>所属地区 <em>*</em></span>
            <a-cascader
              :value="regionPath"
              :options="pcaTextArr"
              placeholder="请选择省 / 市 / 区"
              @change="handleRegionChange"
            />
          </label>

          <label class="company-editor__field company-editor__field--full">
            <span>详细地址 <em>*</em></span>
            <a-input v-model:value="form.address" placeholder="请输入街道、门牌号等详细地址" />
          </label>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="company-editor__footer">
        <span><em>*</em> 为必填信息</span>
        <div>
          <a-button :disabled="saving" @click="emit('close')">取消</a-button>
          <a-button type="primary" :loading="saving" @click="submit">
            {{ isEdit ? '保存修改' : '创建企业' }}
          </a-button>
        </div>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
.company-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  margin: -24px;
  padding: 24px;
  background: #f4f7fb;
}

.company-editor__drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-editor__title-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 8px 18px rgb(37 99 235 / 22%);
  font-size: 16px;
  font-weight: 800;
}

.company-editor__field-error {
  color: #ef4444 !important;
}

.company-editor__drawer-title div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.company-editor__drawer-title strong {
  color: #172033;
  font-size: 16px;
  line-height: 1.3;
}

.company-editor__drawer-title small {
  color: #8490a3;
  font-size: 12px;
  font-weight: 400;
}

.company-editor__section {
  padding: 20px;
  border: 1px solid #e5eaf2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 12px rgb(15 23 42 / 4%);
}

.company-editor__section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-left: 11px;
  border-left: 3px solid #2563eb;
}

.company-editor__section-header h3 {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.company-editor__section-header p {
  margin: 3px 0 0;
  color: #8a96a8;
  font-size: 12px;
}

.company-editor__section-header > span {
  flex: none;
  padding: 4px 9px;
  border-radius: 999px;
  color: #55708f;
  background: #f0f5fb;
  font-size: 11px;
}

.company-editor__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
}

.company-editor__profile-grid {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 18px 16px;
  margin-top: 18px;
}

.company-editor__field small {
  color: #8a96a8;
  font-size: 11px;
  line-height: 1.5;
}

.company-editor__logo-upload {
  display: grid;
  width: 40px;
  height: 40px;
  overflow: hidden;
  place-items: center;
  border: 1px dashed #cfd9e8;
  border-radius: 8px;
  color: #64748b;
  background: #f8faff;
}

.company-editor__logo-upload:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.company-editor__logo-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-editor__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.company-editor__field--full {
  grid-column: 1 / -1;
}

.company-editor__field > span,
.company-editor__upload-label {
  color: #46546a;
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
}

.company-editor em {
  color: #ef4444;
  font-style: normal;
}

.company-editor__upload-label {
  display: block;
  margin-bottom: 8px;
}

.company-editor__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  min-height: 104px;
  padding: 16px;
  text-align: left;
}

.company-editor__upload-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: none;
  place-items: center;
  border-radius: 13px;
  color: #2563eb;
  background: #eaf2ff;
  font-size: 22px;
}

.company-editor__upload strong {
  display: block;
  overflow: hidden;
  max-width: 420px;
  color: #25324a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-editor__upload p {
  margin: 5px 0 0;
  color: #8a96a8;
  font-size: 12px;
}

.company-editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.company-editor__footer > span {
  color: #8a96a8;
  font-size: 12px;
}

.company-editor__footer em {
  color: #ef4444;
  font-style: normal;
}

.company-editor__footer > div {
  display: flex;
  gap: 10px;
}

.company-editor__footer :deep(.ant-btn) {
  min-width: 92px;
}

.company-editor :deep(.ant-input),
.company-editor :deep(.ant-select-selector) {
  border-color: #dfe5ee;
  border-radius: 8px;
}

.company-editor :deep(.ant-input) {
  min-height: 38px;
}

.company-editor :deep(.ant-select-selector) {
  min-height: 38px;
  align-items: center;
}

.company-editor :deep(.ant-upload-wrapper .ant-upload-drag) {
  border-color: #cfd9e8;
  border-radius: 11px;
  background: #f8faff;
}

.company-editor :deep(.ant-upload-wrapper .ant-upload-drag:hover) {
  border-color: #2563eb;
  background: #f2f7ff;
}

@media (max-width: 600px) {
  .company-editor {
    padding: 16px;
  }

  .company-editor__section {
    padding: 16px;
  }

  .company-editor__grid {
    grid-template-columns: 1fr;
  }

  .company-editor__profile-grid {
    grid-template-columns: 1fr;
  }

  .company-editor__field--full {
    grid-column: auto;
  }

  .company-editor__section-header > span,
  .company-editor__footer > span {
    display: none;
  }

  .company-editor__footer {
    justify-content: flex-end;
  }
}
</style>
