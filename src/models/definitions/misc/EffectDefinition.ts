import type { EffectType } from '@/constants'
import type { PropertyType } from '@/models/property/PropertyType'

export interface EffectDefinition {
  property: PropertyType
  type: EffectType
  value: number
}
