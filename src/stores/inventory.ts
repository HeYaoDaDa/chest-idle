import { computed, shallowReactive } from 'vue'
import { defineStore } from 'pinia'
import type { Item } from '@/models/item'
import { InventoryItem } from '@/models/inventory/InventoryItem'
import { useDataStore } from './data'

export const useInventoryStore = defineStore('inventory', () => {
  const dataStore = useDataStore()
  const inventoryItemMap = shallowReactive(new Map<string, InventoryItem>())

  const inventoryItems = computed(() =>
    Array.from(inventoryItemMap.values()).sort((a, b) => a.item.sort - b.item.sort),
  )

  function clear() {
    inventoryItemMap.clear()
  }

  function add(itemOrId: Item | string, amount: number) {
    const item = typeof itemOrId === 'string' ? dataStore.getItemById(itemOrId) : itemOrId
    const existItem = inventoryItemMap.get(item.id)
    if (existItem) {
      existItem.amount.value += amount
    } else {
      inventoryItemMap.set(item.id, new InventoryItem(item, amount))
    }
  }

  function addMany(items: [Item | string, number][]) {
    for (const [itemOrId, amount] of items) {
      add(itemOrId, amount)
    }
  }

  function remove(itemOrId: InventoryItem | string, amount: number) {
    const entry =
      typeof itemOrId === 'string' ? inventoryItemMap.get(itemOrId) : inventoryItemMap.get(itemOrId.item.id)

    if (!entry) {
      console.error(`Not exist inventory item ${typeof itemOrId === 'string' ? itemOrId : itemOrId.item.id}`)
      return
    }

    if (entry.amount.value > amount) {
      entry.amount.value -= amount
    } else {
      if (entry.amount.value < amount) {
        console.error(`${entry.item.id} amount ${entry.amount.value} < ${amount}`)
      }
      inventoryItemMap.delete(entry.item.id)
    }
  }

  function removeMany(items: [InventoryItem | string, number][]) {
    for (const [itemOrId, amount] of items) {
      remove(itemOrId, amount)
    }
  }

  return {
    inventoryItems,
    inventoryItemMap,
    clear,
    add,
    addMany,
    remove,
    removeMany,
  }
})
