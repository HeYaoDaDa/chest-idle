import { defineStore } from 'pinia'

import { actionConfigMap } from '@/gameConfig'

import { useSkillStore } from './skill'
import { useStatStore } from './stat'

export interface Action {
  id: string
  sort: number
  tab?: string
  name: string
  description: string
  skillId: string
  minLevel: number
  chestId: string
  ingredients: { itemId: string; count: number }[]
  products: { itemId: string; count: number }[]

  duration: number
  xp: number
  chestPoints: number
}

export const useActionStore = defineStore('action', () => {
  const statStore = useStatStore()
  const skillStore = useSkillStore()

  function getActionById(actionId: string): Action {
    const actionConfig = actionConfigMap[actionId]
    if (!actionConfig) {
      throw new Error(`Action with id ${actionId} not found`)
    }

    return {
      ...actionConfig,
      ingredients: actionConfig.ingredients ?? [],
      products: actionConfig.products ?? [],
      duration:
        statStore.getDerivedStatValue([], actionConfig.duration, {
          type: 'inversePercentage',
          value: (skillStore.getSkillLevel(actionConfig.skillId) - actionConfig.minLevel) * 0.01,
        }) * 0.01,
      xp: statStore.getDerivedStatValue([], actionConfig.xp),
      chestPoints: statStore.getDerivedStatValue([], actionConfig.chestPoints),
    }
  }

  return {
    getActionById,
  }
})
