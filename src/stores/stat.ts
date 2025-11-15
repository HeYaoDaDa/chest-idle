import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  statConfigMap,
  type DerivedValueConfig,
  type EffectType,
  type ModifierConfig,
} from '@/gameConfig'

interface Effect {
  statId: string
  type: EffectType
  value: number
}

interface Modifier {
  type: EffectType
  value: number
}

interface Stat {
  id: string
  sort: number
  name: string
  description: string
  base: number
  value: number
  modifiers: Modifier[]
}
export const useStatStore = defineStore('stat', () => {
  const sourceIdEffectsMap = ref<Record<string, Effect[]>>(Object.create(null))

  const statList = computed(() => {
    const stats: Stat[] = []
    for (const statId in statConfigMap) {
      const stat = getStat(statId)
      if (stat) {
        stats.push(stat)
      }
    }

    stats.sort((a, b) => a.sort - b.sort)
    return stats
  })

  function addEffectsFromSource(sourceId: string, effects: Effect[]): void {
    sourceIdEffectsMap.value[sourceId] = effects
  }

  function removeEffectsFromSource(sourceId: string): void {
    delete sourceIdEffectsMap.value[sourceId]
  }

  function getModifiersByStatId(statId: string): Modifier[] {
    const modifiers: Modifier[] = []
    for (const effects of Object.values(sourceIdEffectsMap.value)) {
      for (const effect of effects) {
        if (effect.statId === statId) {
          modifiers.push({
            type: effect.type,
            value: effect.value,
          })
        }
      }
    }
    return modifiers
  }

  function getStat(statId: string): Stat | undefined {
    const statConfig = statConfigMap[statId]
    if (!statConfig) return undefined
    const modifiers = getModifiersByStatId(statId)
    const value = getStatValue(statId)
    return {
      ...statConfig,
      base: statConfig.base ?? 0,
      value,
      modifiers,
    }
  }

  function getStatValue(statId: string): number {
    const statConfig = statConfigMap[statId]
    if (!statConfig) return 0
    const modifiers = getModifiersByStatId(statId)
    let sumAdd = 0
    let sumPercent = 0
    let sumDivisor = 0

    for (const { type, value } of modifiers) {
      switch (type) {
        case 'flat':
          sumAdd += value
          break
        case 'percentage':
          sumPercent += value
          break
        case 'inversePercentage':
          sumDivisor += value
          break
      }
    }
    return (((statConfig.base ?? 0) + sumAdd) * (1 + sumPercent)) / (1 + sumDivisor)
  }

  function getDerivedStatValue(
    derivedStatConfigs: {
      statId: string
      type: EffectType
    }[],
    baseValue: number = 0,
    ...extendModifiers: Modifier[]
  ): number {
    let sumAdd = 0
    let sumPercent = 0
    let sumDivisor = 0

    for (const { statId, type } of derivedStatConfigs) {
      const statValue = getStatValue(statId)
      switch (type) {
        case 'flat':
          sumAdd += statValue
          break
        case 'percentage':
          sumPercent += statValue
          break
        case 'inversePercentage':
          sumDivisor += statValue
          break
      }
    }

    for (const { type, value } of extendModifiers) {
      switch (type) {
        case 'flat':
          sumAdd += value
          break
        case 'percentage':
          sumPercent += value
          break
        case 'inversePercentage':
          sumDivisor += value
          break
      }
    }

    return ((baseValue + sumAdd) * (1 + sumPercent)) / (1 + sumDivisor)
  }

  function calculateDerivedValue(
    config: DerivedValueConfig,
    resolveModifierValue?: (modifier: ModifierConfig) => number | undefined,
  ): number {
    const modifiers = config.modifiers ?? []

    if (modifiers.length === 0) {
      return config.baseValue
    }

    let sumAdd = 0
    let sumPercent = 0
    let sumDivisor = 0

    const applyModifier = (type: EffectType, value: number) => {
      switch (type) {
        case 'flat':
          sumAdd += value
          break
        case 'percentage':
          sumPercent += value
          break
        case 'inversePercentage':
          sumDivisor += value
          break
      }
    }

    for (const modifier of modifiers) {
      // Ask the caller if they can handle this modifier
      const customValue = resolveModifierValue?.(modifier)

      if (customValue !== undefined) {
        // Caller provided a value
        applyModifier(modifier.type, customValue)
      } else if (modifier.modifierType === 'stat') {
        // Default handling for stat modifiers
        const statValue = getStatValue(modifier.statId)
        applyModifier(modifier.type, statValue)
      }
    }

    return ((config.baseValue + sumAdd) * (1 + sumPercent)) / (1 + sumDivisor)
  }

  return {
    sourceIdEffectsMap,

    statList,

    addEffectsFromSource,
    removeEffectsFromSource,
    getModifiersByStatId,

    getStat,
    getStatValue,
    getDerivedStatValue,
    calculateDerivedValue,
  }
})
