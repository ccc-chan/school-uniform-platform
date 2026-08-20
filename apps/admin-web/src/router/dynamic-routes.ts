import type { RouteRecordRaw, Router } from 'vue-router'

// 所有业务页面按需加载，只有访问对应路由时才下载组件代码。
const DashboardView = () => import('@/views/DashboardView.vue')
const ProductListView = () => import('@/views/products/ProductListView.vue')
const ProductDetailView = () => import('@/views/products/ProductDetailView.vue')
const ProductFormView = () => import('@/views/products/ProductFormView.vue')
const QrCenterView = () => import('@/views/qrcodes/QrCenterView.vue')
const QrGenerateView = () => import('@/views/qrcodes/QrGenerateView.vue')
const QrBatchGenerateView = () =>
  import('@/views/qrcodes/QrBatchGenerateView.vue')
const QrBindView = () => import('@/views/qrcodes/QrBindView.vue')
const QrLabelPrintView = () => import('@/views/qrcodes/QrLabelPrintView.vue')
const ProductionOrdersView = () =>
  import('@/views/production/ProductionOrdersView.vue')
const ProductionOrderDetailView = () =>
  import('@/views/production/ProductionOrderDetailView.vue')
const ProductionResourceView = () =>
  import('@/views/production/ProductionResourceView.vue')
const QualityReportsView = () =>
  import('@/views/quality/QualityReportsView.vue')
const QualityReportUploadView = () =>
  import('@/views/quality/QualityReportUploadView.vue')
const QualityReportDetailView = () =>
  import('@/views/quality/QualityReportDetailView.vue')
const QualityItemsView = () => import('@/views/quality/QualityItemsView.vue')
const QualityHistoryView = () =>
  import('@/views/quality/QualityHistoryView.vue')
const BrandProfileView = () => import('@/views/brand/BrandProfileView.vue')
const BrandAssetsView = () => import('@/views/brand/BrandAssetsView.vue')
const AnalyticsView = () => import('@/views/analytics/AnalyticsView.vue')
const EmployeeAccountsView = () =>
  import('@/views/system/EmployeeAccountsView.vue')
const RolePermissionsView = () =>
  import('@/views/system/RolePermissionsView.vue')
const OperationLogsView = () => import('@/views/system/OperationLogsView.vue')
const FileManagementView = () => import('@/views/system/FileManagementView.vue')

// 路由定义按服务端菜单码分组，meta 继续声明页面内操作权限。
const definitions: Record<string, RouteRecordRaw[]> = {
  dashboard: [
    {
      path: 'dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: '首页概览',
        requiresAuth: true,
        menuCode: 'dashboard',
      },
    },
    {
      path: 'products/new',
      name: 'product-new',
      component: ProductFormView,
      meta: {
        title: '新建产品',
        requiresAuth: true,
        menuCode: 'products',
        requiredPermission: 'product.create',
        breadcrumb: [{ title: '产品列表', path: '/products' }],
      },
    },
    {
      path: 'products/:id/edit',
      name: 'product-edit',
      component: ProductFormView,
      meta: {
        title: '编辑产品',
        requiresAuth: true,
        menuCode: 'products',
        requiredPermission: 'product.edit',
        breadcrumb: [{ title: '产品列表', path: '/products' }],
      },
    },
  ],
  products: [
    {
      path: 'products',
      name: 'products',
      component: ProductListView,
      meta: {
        title: '产品列表',
        requiresAuth: true,
        menuCode: 'products',
      },
    },
    {
      path: 'products/:id',
      name: 'product-detail',
      component: ProductDetailView,
      meta: {
        title: '产品详情',
        requiresAuth: true,
        menuCode: 'products',
        requiredPermission: 'product.view',
      },
    },
  ],
  qrcodes: [
    {
      path: 'qrcodes',
      name: 'qrcodes',
      component: QrCenterView,
      meta: {
        title: '二维码首页',
        requiresAuth: true,
        menuCode: 'qrcodes',
        requiredPermission: 'qrcode.view',
      },
    },
    {
      path: 'qrcodes/generate',
      name: 'qrcode-generate',
      component: QrGenerateView,
      meta: {
        title: '生成二维码',
        requiresAuth: true,
        menuCode: 'qrcodes',
        requiredPermission: 'qrcode.generate',
      },
    },
    {
      path: 'qrcodes/batch-generate',
      name: 'qrcode-batch-generate',
      component: QrBatchGenerateView,
      meta: {
        title: '批量生成二维码',
        requiresAuth: true,
        menuCode: 'qrcodes',
        requiredPermission: 'qrcode.batch_generate',
      },
    },
    {
      path: 'qrcodes/bind',
      name: 'qrcode-bind',
      component: QrBindView,
      meta: {
        title: '二维码绑定',
        requiresAuth: true,
        menuCode: 'qrcodes',
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
        menuCode: 'qrcodes',
        requiredPermission: 'qrcode.view',
      },
    },
  ],
  production: [
    {
      path: 'production/orders',
      name: 'production-orders',
      component: ProductionOrdersView,
      meta: {
        title: '生产订单',
        requiresAuth: true,
        menuCode: 'production',
        requiredPermission: 'production.view',
      },
    },
    {
      path: 'production/orders/new',
      name: 'production-order-new',
      component: ProductionOrderDetailView,
      meta: {
        title: '新建生产订单',
        requiresAuth: true,
        menuCode: 'production',
        requiredPermission: 'production.order.create',
        breadcrumb: [{ title: '生产订单', path: '/production/orders' }],
      },
    },
    {
      path: 'production/orders/:id',
      name: 'production-order-detail',
      component: ProductionOrderDetailView,
      meta: {
        title: '生产订单详情',
        requiresAuth: true,
        menuCode: 'production',
        requiredPermission: 'production.order.edit',
        breadcrumb: [{ title: '生产订单', path: '/production/orders' }],
      },
    },
    ...[
      ['batches', '生产批次管理'],
      ['processes', '生产流程管理'],
      ['records', '生产记录'],
      ['factories', '工厂管理'],
      ['outbounds', '出厂管理'],
    ].map(
      ([resource, title]) =>
        ({
          path: `production/${resource}`,
          name: `production-${resource}`,
          component: ProductionResourceView,
          meta: {
            title,
            requiresAuth: true,
            menuCode: 'production',
            requiredPermission: 'production.view',
            productionResource: resource,
          },
        }) as RouteRecordRaw,
    ),
  ],
  quality: [
    {
      path: 'quality/reports',
      name: 'quality-reports',
      component: QualityReportsView,
      meta: {
        title: '检测报告列表',
        requiresAuth: true,
        menuCode: 'quality',
        requiredPermission: 'quality.view',
      },
    },
    {
      path: 'quality/reports/upload',
      name: 'quality-report-upload',
      component: QualityReportUploadView,
      meta: {
        title: '上传检测报告',
        requiresAuth: true,
        menuCode: 'quality',
        requiredPermission: 'quality.report.create',
        breadcrumb: [{ title: '检测报告列表', path: '/quality/reports' }],
      },
    },
    {
      path: 'quality/reports/:id',
      name: 'quality-report-detail',
      component: QualityReportDetailView,
      meta: {
        title: '检测报告详情',
        requiresAuth: true,
        menuCode: 'quality',
        requiredPermission: 'quality.view',
        breadcrumb: [{ title: '检测报告列表', path: '/quality/reports' }],
      },
    },
    {
      path: 'quality/items',
      name: 'quality-items',
      component: QualityItemsView,
      meta: {
        title: '检测项目管理',
        requiresAuth: true,
        menuCode: 'quality',
        requiredPermission: 'quality.view',
      },
    },
    {
      path: 'quality/history',
      name: 'quality-history',
      component: QualityHistoryView,
      meta: {
        title: '检测历史记录',
        requiresAuth: true,
        menuCode: 'quality',
        requiredPermission: 'quality.view',
      },
    },
  ],
  brand: [
    {
      path: 'brand/profile',
      name: 'brand-profile',
      component: BrandProfileView,
      meta: {
        title: '品牌资料管理',
        requiresAuth: true,
        menuCode: 'brand',
        requiredPermission: 'brand.view',
      },
    },
    ...[
      ['stories', 'story', '品牌故事管理'],
      ['factories', 'factory', '工厂展示管理'],
      ['videos', 'video', '视频资料管理'],
    ].map(
      ([path, type, title]) =>
        ({
          path: `brand/${path}`,
          name: `brand-${path}`,
          component: BrandAssetsView,
          meta: {
            title,
            requiresAuth: true,
            menuCode: 'brand',
            requiredPermission: 'brand.view',
            brandAssetType: type,
          },
        }) as RouteRecordRaw,
    ),
  ],
  analytics: [
    {
      path: 'analytics/scans',
      name: 'analytics-scans',
      component: AnalyticsView,
      meta: {
        title: '扫码统计分析',
        requiresAuth: true,
        menuCode: 'analytics',
        requiredPermission: 'analytics.view',
        analyticsPage: 'scans',
      },
    },
    {
      path: 'analytics/products',
      name: 'analytics-products',
      component: AnalyticsView,
      meta: {
        title: '产品分析',
        requiresAuth: true,
        menuCode: 'analytics',
        requiredPermission: 'analytics.view',
        analyticsPage: 'products',
      },
    },
    {
      path: 'analytics/regions',
      name: 'analytics-regions',
      component: AnalyticsView,
      meta: {
        title: '区域分析',
        requiresAuth: true,
        menuCode: 'analytics',
        requiredPermission: 'analytics.view',
        analyticsPage: 'regions',
      },
    },
    {
      path: 'analytics/screen',
      name: 'analytics-screen',
      component: AnalyticsView,
      meta: {
        title: '数据大屏',
        requiresAuth: true,
        menuCode: 'analytics',
        requiredPermission: 'analytics.view',
        analyticsPage: 'screen',
      },
    },
  ],
  system: [
    {
      path: 'system/employees',
      name: 'system-employees',
      component: EmployeeAccountsView,
      meta: {
        title: '员工账号管理',
        requiresAuth: true,
        menuCode: 'system',
      },
    },
    {
      path: 'system/roles',
      name: 'system-roles',
      component: RolePermissionsView,
      meta: {
        title: '角色权限管理',
        requiresAuth: true,
        menuCode: 'system',
      },
    },
    {
      path: 'system/operation-logs',
      name: 'system-operation-logs',
      component: OperationLogsView,
      meta: { title: '操作日志管理', requiresAuth: true, menuCode: 'system' },
    },
    {
      path: 'system/files',
      name: 'system-files',
      component: FileManagementView,
      meta: { title: '文件管理', requiresAuth: true, menuCode: 'system' },
    },
  ],
}

// 保存本次已注入的路由名和菜单签名，用于安全替换用户动态路由。
const registeredNames = new Set<string>()
let registeredSignature = ''

export function syncDynamicRoutes(router: Router, menuCodes: string[]) {
  // 菜单顺序不影响路由集合，因此排序后生成稳定签名。
  const signature = [...menuCodes].sort().join(',')

  if (signature === registeredSignature) return false

  // 先移除上一授权快照的路由，再按当前菜单重新注入。
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
  // 按产品约定的模块优先级选择登录后的首个可访问页面。
  if (menuCodes.includes('dashboard')) return '/dashboard'
  if (menuCodes.includes('products')) return '/products'
  if (menuCodes.includes('qrcodes')) return '/qrcodes'
  if (menuCodes.includes('production')) return '/production/orders'
  if (menuCodes.includes('quality')) return '/quality/reports'
  if (menuCodes.includes('brand')) return '/brand/profile'
  if (menuCodes.includes('analytics')) return '/analytics/scans'
  if (menuCodes.includes('system')) return '/system/employees'
  return '/no-access'
}
