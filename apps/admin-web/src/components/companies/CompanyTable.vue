<script setup lang="ts">
import type { Company } from '@/api/companies'
defineProps<{ items: Company[]; loading: boolean; canEdit: boolean; canDelete: boolean }>()
const emit = defineEmits<{ edit: [item: Company]; toggle: [item: Company]; delete: [item: Company] }>()
const asCompany = (value: Record<string, unknown>) => value as unknown as Company
const columns = [{ title: '公司名称', key: 'name' }, { title: '统一社会信用代码', dataIndex: 'creditCode' }, { title: '法人', dataIndex: 'legalRepresentative' }, { title: '地址', dataIndex: 'address' }, { title: '联系电话', dataIndex: 'contactPhone' }, { title: '状态', key: 'status', width: 90 }, { title: '操作', key: 'actions', width: 210 }]
</script>

<template>
  <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1050 }">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'name'"><strong>{{ record.name }}</strong><div class="company-table__brand">{{ record.brandName || '—' }}</div></template>
      <a-tag v-else-if="column.key === 'status'" :color="record.status === 'enabled' ? 'green' : 'default'">{{ record.status === 'enabled' ? '启用' : '停用' }}</a-tag>
      <a-space v-else-if="column.key === 'actions'">
        <a-button v-if="canEdit" type="link" size="small" @click="emit('edit', asCompany(record))">修改</a-button>
        <a-button v-if="canEdit" type="link" size="small" @click="emit('toggle', asCompany(record))">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button>
        <a-button v-if="canDelete" type="link" danger size="small" @click="emit('delete', asCompany(record))">删除</a-button>
      </a-space>
    </template>
  </a-table>
</template>

<style scoped>.company-table__brand{margin-top:3px;color:#94a3b8;font-size:12px}</style>
