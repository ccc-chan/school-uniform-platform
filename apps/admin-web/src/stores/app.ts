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
