import { createRouter, createWebHistory } from 'vue-router'
import LoadPage from '@/pages/LoadPage.vue'
import GamePage from '@/pages/GamePage.vue'
import SkillPage from '@/pages/SkillPage.vue'
import { global } from '@/models/global'

export const ROUTE_PATH_LOAD = "/"
export const ROUTE_NAME_LOAD = "load"
export const ROUTE_PATH_GAME = "/game"
export const ROUTE_PATH_GAME_MINING = "/game/mining"
export const ROUTE_NAME_GAME = "game"
export const ROUTE_NAME_404 = "404"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: ROUTE_PATH_LOAD,
      name: ROUTE_NAME_LOAD,
      component: LoadPage,
    },
    {
      path: ROUTE_PATH_GAME,
      name: ROUTE_NAME_GAME,
      redirect: ROUTE_PATH_GAME_MINING,
      meta: { requireGameData: true },
      component: GamePage,
      children: [
        {
          path: ':id',
          name: 'skill',
          component: SkillPage,
        },
      ],
    },
    {
      path: '/:catchAll(.*)*',
      name: ROUTE_NAME_404,
      component: () => import('@/pages/ErrorNotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requireGameData && ['none', 'loading'].includes(global.status.value)) {
    return ROUTE_PATH_LOAD
  }
})

export default router
