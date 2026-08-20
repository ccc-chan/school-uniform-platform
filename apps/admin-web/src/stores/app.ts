// 保存管理端壳层的全局界面状态。
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = shallowRef(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
  }
})
