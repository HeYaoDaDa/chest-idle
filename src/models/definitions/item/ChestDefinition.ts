import type { LootEntryDefinition } from '../misc/LootEntryDefinition'

export interface ChestDefinition {
  type: 'item'
  category: 'chest'
  id: string
  sort: number
  chest: {
    maxPoints: number
    loots: LootEntryDefinition[]
  }
}
