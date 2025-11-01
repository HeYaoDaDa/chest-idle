import type { EffectType } from '@/constants'

export interface InactiveEffect {
  state: string
  type: EffectType
  value: number
}
