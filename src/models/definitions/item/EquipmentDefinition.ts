import type { EffectDefinition } from '../misc/EffectDefinition'

export interface EquipmentDefinition {
  type: 'item'
  category: 'equipment'
  id: string
  sort: number
  equipment: {
    slot: string
    effects: EffectDefinition[]
  }
}
