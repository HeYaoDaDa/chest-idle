import { defineStore } from 'pinia'

import { actionConfigMap, type ModifierConfig } from '@/gameConfig'

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

    // Resolver function to handle skillLevel modifiers
    const resolveModifier = (modifier: ModifierConfig) => {
      if (modifier.modifierType === 'skillLevel') {
        const currentLevel = skillStore.getSkillLevel(actionConfig.skillId)
        return (currentLevel - actionConfig.minLevel) * modifier.perLevelValue
      }
      return undefined // Let stat.ts handle stat modifiers
    }

    return {
      ...actionConfig,
      ingredients: actionConfig.ingredients ?? [],
      products: actionConfig.products ?? [],
      duration: statStore.calculateDerivedValue(actionConfig.duration, resolveModifier) * 0.01,
      xp: statStore.calculateDerivedValue(actionConfig.xp, resolveModifier),
      chestPoints: statStore.calculateDerivedValue(actionConfig.chestPoints, resolveModifier),
    }
  }

  return {
    getActionById,
  }
})
