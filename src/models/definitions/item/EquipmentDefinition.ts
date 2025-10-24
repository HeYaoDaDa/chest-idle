import type { EffectDefinition } from '../misc/EffectDefinition'

export interface EquipmentDefinition {
  type: 'item'
  itemType: 'equipment'
  id: string
  sort: number
  slot: string
  effects: EffectDefinition[]
}
