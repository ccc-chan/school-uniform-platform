<script setup lang="ts">
import type { Company } from '@/api/companies'
defineProps<{ items: Company[]; loading: boolean; canEdit: boolean; canDelete: boolean }>()
const emit = defineEmits<{ edit: [item: Company]; toggle: [item: Company]; delete: [item: Company] }>()
const asCompany = (value: Record<string, unknown>) => value as unknown as Company
const columns = [{ title: '企业名称', dataIndex: 'name' }, { title: '统一社会信用代码', dataIndex: 'creditCode' }, { title: '法人', dataIndex: 'legalRepresentative' }, { title: '地址', dataIndex: 'address' }, { title: '联系电话', dataIndex: 'contactPhone' }, { title: '地区', dataIndex: 'region' }, { title: '品牌名称', dataIndex: 'brandName' }, { title: '操作', key: 'actions', width: 210 }]
</script>

<template>
  <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 1050 }">
    <template #bodyCell="{ column, record }">
      <a-space v-if="column.key === 'actions'">
        <a-button v-if="canEdit" type="link" size="small" @click="emit('edit', asCompany(record))">修改</a-button>
        <a-button v-if="canEdit" type="link" size="small" @click="emit('toggle', asCompany(record))">{{ record.status === 'enabled' ? '停用' : '启用' }}</a-button>
        <a-button v-if="canDelete" type="link" danger size="small" @click="emit('delete', asCompany(record))">删除</a-button>
      </a-space>
    </template>
  </a-table>
</template>
