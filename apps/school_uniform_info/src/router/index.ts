import { createRouter, createWebHistory } from 'vue-router'
import SchoolUniformInfoLayout from '@/layouts/SchoolUniformInfoLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/school_uniform_info/:code',
      component: SchoolUniformInfoLayout,
      props: true,
      children: [
        {
          path: '',
          name: 'school-uniform-info-home',
          component: () => import('@/views/SchoolUniformInfoHomeView.vue'),
        },
        {
          path: 'product',
          name: 'school-uniform-info-product',
          component: () => import('@/views/ProductInfoView.vue'),
        },
        {
          path: 'production',
          name: 'school-uniform-info-production',
          component: () => import('@/views/ProductionInfoView.vue'),
        },
        {
          path: 'quality',
          name: 'school-uniform-info-quality',
          component: () => import('@/views/QualityInfoView.vue'),
        },
        {
          path: 'verify',
          name: 'school-uniform-info-verify',
          component: () => import('@/views/AntiCounterfeitView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/SchoolUniformInfoNotFoundView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
