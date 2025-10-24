import type { EffectType, SpecialEffect } from '@/constants'

export interface MutableStateDefinition {
  base: number
  boosts: ({ state: string; type: EffectType } | SpecialEffect)[]
}
