import type { EffectType } from '@/constants'
import type { PropertyType } from '@/models/property/PropertyType'

export interface EffectConfig {
  property: PropertyType
  type: EffectType
  value: number
}
