import type { LootEntryDefinition } from "../misc/LootEntryDefinition"

export interface ChestDefinition {
  type: "item"
  itemType: "chest"
  id: string
  sort: number
  loots: LootEntryDefinition[]
}
