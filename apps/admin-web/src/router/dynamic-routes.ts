import type { RouteRecordRaw, Router } from 'vue-router'

// 当前导航只注册五个快捷入口及其必要的内部页面。
const DashboardView = () => import('@/views/DashboardView.vue')
const ProductListView = () => import('@/views/products/ProductListView.vue')
const ProductDetailView = () => import('@/views/products/ProductDetailView.vue')
const QrGenerateView = () => import('@/views/qrcodes/QrGenerateView.vue')
const QrBindView = () => import('@/views/qrcodes/QrBindView.vue')
const QrLabelPrintView = () => import('@/views/qrcodes/QrLabelPrintView.vue')
const QualityReportUploadView = () =>
  import('@/views/quality/QualityReportUploadView.vue')
const BrandProfileView = () => import('@/views/brand/BrandProfileView.vue')
const EmployeeAccountsView = () =>
  import('@/views/system/EmployeeAccountsView.vue')
const RolePermissionsView = () =>
  import('@/views/system/RolePermissionsView.vue')
const OperationLogsView = () => import('@/views/system/OperationLogsView.vue')

const definitions: Record<string, RouteRecordRaw[]> = {
  shortcut_dashboard: [
    {
      path: 'dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: '仪表盘',
        requiresAuth: true,
        menuCode: 'shortcut_dashboard',
      },
    },
  ],
  shortcut_products: [
    {
      path: 'products',
      name: 'products',
      component: ProductListView,
      meta: {
        title: '产品管理',
        requiresAuth: true,
        menuCode: 'shortcut_products',
      },
    },
    {
      path: 'products/:id/edit',
      name: 'product-edit',
      component: ProductListView,
      meta: {
        title: '编辑产品',
        requiresAuth: true,
        menuCode: 'shortcut_products',
        requiredPermission: 'product.edit',
        breadcrumb: [{ title: '产品管理', path: '/products' }],
      },
    },
    {
      path: 'products/:id',
      name: 'product-detail',
      component: ProductDetailView,
      meta: {
        title: '产品详情',
        requiresAuth: true,
        menuCode: 'shortcut_products',
        requiredPermission: 'product.view',
      },
    },
    {
      path: 'quality/reports/upload',
      name: 'quality-report-upload',
      component: QualityReportUploadView,
      meta: {
        title: '上传检测报告',
        requiresAuth: true,
        menuCode: 'shortcut_products',
        requiredPermission: 'quality.report.create',
      },
    },
  ],
  shortcut_label_print: [
    {
      path: 'qrcodes/generate',
      name: 'qrcode-generate',
      component: QrGenerateView,
      meta: {
        title: '生成二维码',
        requiresAuth: true,
        menuCode: 'shortcut_label_print',
        requiredPermission: 'qrcode.generate',
      },
    },
    {
      path: 'qrcodes/bind',
      name: 'qrcode-bind',
      component: QrBindView,
      meta: {
        title: '二维码绑定',
        requiresAuth: true,
        menuCode: 'shortcut_label_print',
        requiredPermission: 'qrcode.bind',
      },
    },
    {
      path: 'qrcodes/label-print',
      name: 'qrcode-label-print',
      component: QrLabelPrintView,
      meta: {
        title: '标签打印',
        requiresAuth: true,
        menuCode: 'shortcut_label_print',
        requiredPermission: 'qrcode.view',
      },
    },
  ],
  shortcut_company_settings: [
    {
      path: 'brand/profile',
      name: 'brand-profile',
      component: BrandProfileView,
      meta: {
        title: '公司设置',
        requiresAuth: true,
        menuCode: 'shortcut_company_settings',
        requiredPermission: 'brand.view',
      },
    },
  ],
  shortcut_system: [
    {
      path: 'system/employees',
      name: 'system-employees',
      component: EmployeeAccountsView,
      meta: {
        title: '员工账号管理',
        requiresAuth: true,
        menuCode: 'shortcut_system',
      },
    },
    {
      path: 'system/roles',
      name: 'system-roles',
      component: RolePermissionsView,
      meta: {
        title: '角色权限管理',
        requiresAuth: true,
        menuCode: 'shortcut_system',
      },
    },
    {
      path: 'system/operation-logs',
      name: 'system-operation-logs',
      component: OperationLogsView,
      meta: {
        title: '操作日志管理',
        requiresAuth: true,
        menuCode: 'shortcut_system',
      },
    },
  ],
}

const registeredNames = new Set<string>()
let registeredSignature = ''

export function syncDynamicRoutes(router: Router, menuCodes: string[]) {
  const signature = [...menuCodes].sort().join(',')

  if (signature === registeredSignature) return false

  for (const name of registeredNames) {
    if (router.hasRoute(name)) router.removeRoute(name)
  }
  registeredNames.clear()

  for (const code of menuCodes) {
    for (const route of definitions[code] || []) {
      router.addRoute('admin', route)
      if (route.name) registeredNames.add(String(route.name))
    }
  }

  registeredSignature = signature
  return true
}

export function getDefaultRoute(menuCodes: string[]) {
  if (menuCodes.includes('shortcut_dashboard')) return '/dashboard'
  if (menuCodes.includes('shortcut_products')) return '/products'
  if (menuCodes.includes('shortcut_label_print')) {
    return '/qrcodes/label-print'
  }
  if (menuCodes.includes('shortcut_company_settings')) {
    return '/brand/profile'
  }
  if (menuCodes.includes('shortcut_system')) {
    return '/system/employees'
  }
  return '/no-access'
}
