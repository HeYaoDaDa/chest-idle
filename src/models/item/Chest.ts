import { Item } from '.'
import type { LootEntryDefinition } from '../definitions/misc/LootEntryDefinition'

export class Chest extends Item {
  type = 'chest' as const
  // Loot table is resolved in gameConfig.buildCaches()
  loots: {
    item: Item
    chance: number
    min: number
    max: number
  }[] = []

  constructor(
    id: string,
    sort: number,
    public maxPoints: number,
    public lootDefinitions: LootEntryDefinition[],
  ) {
    super(id, sort)
  }
}
