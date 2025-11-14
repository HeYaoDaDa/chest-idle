import { createRouter, createWebHashHistory } from 'vue-router'

import ChestPage from '@/pages/ChestPage'
import GamePage from '@/pages/GamePage'
import LoadPage from '@/pages/LoadPage'
import MyStuffPage from '@/pages/MyStuffPage'
import SkillPage from '@/pages/SkillPage'
import { useAppStore } from '@/stores/app'

import { skillConfigs } from './gameConfig'

const router = createRouter({
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
      component: () => import('@/pages/ErrorNotFoundPage'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requireGameData) {
    const appStore = useAppStore()
    if ('ready' !== appStore.state) {
      return '/'
    }
  }
  if ('/game' === to.path && skillConfigs.length > 0) {
    return `/game/${skillConfigs[0].id}`
  }
})

export default router
