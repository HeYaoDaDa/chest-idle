import type { EffectType } from '@/constants'

export interface EffectDefinition {
  state: string
  type: EffectType
  value: number
}
