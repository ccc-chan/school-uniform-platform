import { deleteCompany, getCompanies, updateCompanyStatus, type Company, type CompanyFilters } from '@/api/companies'
import { usePagedList } from '@/composables/usePagedList'

export function useCompanies() {
  const list = usePagedList<Company, CompanyFilters>({
    createFilters: () => ({ keyword: '', status: '' }),
    fetchPage: params => getCompanies(params as unknown as Record<string, string | number>),
  })
  async function toggleStatus(item: Company) { await updateCompanyStatus(item.id, item.status === 'enabled' ? 'disabled' : 'enabled'); await list.load() }
  async function remove(item: Company) { await deleteCompany(item.id); if (list.items.value.length === 1 && list.page.value > 1) await list.setPage(list.page.value - 1); else await list.load() }
  return { ...list, toggleStatus, remove }
}
