import type { LootEntryDefinition } from './misc/LootEntryDefinition'
import type { EffectDefinition } from './misc/EffectDefinition'

export interface ItemDefinition {
  type: 'item'
  category: 'resource' | 'chest' | 'equipment'
  id: string
  sort: number
  chest?: {
    maxPoints: number
    loots: LootEntryDefinition[]
  }
  equipment?: {
    slot: string
    effects: EffectDefinition[]
  }
}
