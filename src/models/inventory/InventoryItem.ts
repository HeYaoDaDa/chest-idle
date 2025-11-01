import type { Item } from '../item'
import type { Chest } from '../item/Chest'

// Plain data shape for an inventory entry. Reactivity is owned by the store.
export interface InventoryItem {
  item: Item
  quantity: number
}

function randomIntInclusive(min: number, max: number): number {
  const lower = Math.ceil(min)
  const upper = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

export function rollLoot(chest: Chest): { itemId: string; amount: number }[] {
  const results: { itemId: string; amount: number }[] = []

  for (const loot of chest.loots) {
    if (Math.random() <= loot.chance) {
      const amount = randomIntInclusive(loot.min, loot.max)
      results.push({ itemId: loot.item.id, amount })
    }
  }

  return results
}
