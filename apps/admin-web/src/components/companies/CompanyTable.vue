<script setup lang="ts">
import type { Company } from '@/api/companies'
import CompanyLogo from './CompanyLogo.vue'
defineProps<{ items: Company[]; loading: boolean; canEdit: boolean; canDelete: boolean }>()
const emit = defineEmits<{ edit: [item: Company]; toggle: [item: Company]; delete: [item: Company] }>()
const asCompany = (value: Record<string, unknown>) => value as unknown as Company
const columns = [{ title: '企业名称', dataIndex: 'name', align: 'center' as const }, { title: '统一社会信用代码', dataIndex: 'creditCode', align: 'center' as const }, { title: '法人', dataIndex: 'legalRepresentative', align: 'center' as const }, { title: '地址', dataIndex: 'address', align: 'center' as const }, { title: '联系电话', dataIndex: 'contactPhone', align: 'center' as const }, { title: '地区', dataIndex: 'region', align: 'center' as const }, { title: '品牌名称', key: 'brand', width: 180, align: 'center' as const }, { title: '操作', key: 'actions', width: 210, align: 'center' as const }]
</script>

<template>
  <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1050 }">
    <template #bodyCell="{ column, record }">
      <div v-if="column.key === 'brand'" class="company-table__brand">
        <CompanyLogo
          :company-id="Number(record.id)"
          :brand-name="String(record.brandName || '')"
          :has-logo="Boolean(record.logoFileId)"
        />
        <span>{{ record.brandName || '—' }}</span>
      </div>

      <a-space v-else-if="column.key === 'actions'">
        <a-button v-if="canEdit" type="link" size="small" @click="emit('edit', asCompany(record))">修改</a-button>
        <a-button v-if="canEdit" type="link" size="small" @click="emit('toggle', asCompany(record))">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button>
        <a-button v-if="canDelete" type="link" danger size="small" @click="emit('delete', asCompany(record))">删除</a-button>
      </a-space>
    </template>
  </a-table>
</template>

<style scoped>
.company-table__brand {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.company-table__brand > span {
  overflow: hidden;
  max-width: 150px;
  color: #25324a;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
