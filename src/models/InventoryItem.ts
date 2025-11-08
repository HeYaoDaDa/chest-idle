import type { Item } from './item'

// Plain data shape for an inventory entry. Reactivity is owned by the store.
export interface InventoryItem {
  item: Item
  quantity: number
}
