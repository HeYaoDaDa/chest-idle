import { createRouter, createWebHashHistory } from 'vue-router'
import LoadPage from '@/pages/LoadPage.vue'
import GamePage from '@/pages/GamePage.vue'
import SkillPage from '@/pages/SkillPage.vue'
import ChestPage from '@/pages/ChestPage.vue'
import { useAppStore } from '@/stores/app'
import MyStuffPage from '@/pages/MyStuffPage.vue'
import { useGameConfigStore } from './stores/gameConfig'

const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
      children: [
        {
          path: 'mystuff',
          name: 'mystuff',
          component: MyStuffPage,
        },
        {
          path: 'chests',
          name: 'chests',
          component: ChestPage,
        },
        {
          path: ':id',
          name: 'skill',
          component: SkillPage,
        },
      ],
    },
    {
      path: '/:catchAll(.*)*',
      name: '404',
      component: () => import('@/pages/ErrorNotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requireGameData) {
    const appStore = useAppStore()
    if ('ready' !== appStore.status) {
      return '/'
    }
  }
  const skillConfigs = useGameConfigStore().allSkillConfigs
  if ('/game' === to.path && skillConfigs.length > 0) {
    const id = skillConfigs[0].id
    return `/game/${id}`
  }
})

export default router
