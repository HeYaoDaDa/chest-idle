import { createRouter, createWebHistory } from 'vue-router'
import LoadPage from '@/pages/LoadPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'load',
      component: LoadPage,
    },
    {
      path: '/:catchAll(.*)*',
      name: '404',
      component: () => import('@/pages/ErrorNotFoundPage.vue'),
    },
  ],
})

export default router
