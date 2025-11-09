import type { LootEntryConfig } from './misc/LootEntryConfig'
import type { EffectConfig } from './misc/EffectConfig'

export interface ItemConfig {
  type: 'item'
  category: 'resource' | 'chest' | 'equipment'
  id: string
  sort: number
  chest?: {
    maxPoints: number
    loots: LootEntryConfig[]
  }
  equipment?: {
    slot: string
    effects: EffectConfig[]
  }
}
