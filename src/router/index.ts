import { createRouter, createWebHistory } from 'vue-router'
import LoadPage from '@/pages/LoadPage.vue'
import GamePage from '@/pages/GamePage.vue'
import { useDataStore } from '@/stores/data';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'load',
      component: LoadPage,
    },
    {
      path: '/game',
      name: 'game',
      meta: { requireGameData: true },
      component: GamePage,
    },
    {
      path: '/:catchAll(.*)*',
      name: '404',
      component: () => import('@/pages/ErrorNotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const dataStore = useDataStore();
  if (to.meta.requireGameData && ['none', 'loading'].includes(dataStore.dataStatus)) {
    return { name: 'load' };
  }
});

export default router
