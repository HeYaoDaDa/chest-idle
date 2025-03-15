import { defineStore } from 'pinia'
import { computed, reactive, shallowReactive, type ShallowReactive } from 'vue'
import type { Item } from '@/model/data/Item'
import { useDataStore } from './data'

export const useInventoryStore = defineStore('inventory', () => {
  const dataStore = useDataStore()

  const inventoryItemMap = reactive(new Map<string, InventoryItem>())

  const inventoryItems = computed(() =>
    Array.from(inventoryItemMap.values()).sort((a, b) => a.item.sort - b.item.sort),
  )

  function add(itemOrId: Item | string, amount: number) {
    let item
    if (typeof itemOrId === 'string') {
      item = dataStore.getItemById(itemOrId)
      if (item === undefined) {
        console.error(`Not exist item id ${itemOrId}`)
        return
      }
    } else {
      item = itemOrId
    }
    const existItem = inventoryItemMap.get(item.id)
    if (existItem) {
      existItem.amount += amount
    } else {
      inventoryItemMap.set(item.id, new InventoryItem(item, amount))
    }
  }
  function adds(items: [Item | string, number][]) {
    for (const [itemOrId, amount] of items) {
      add(itemOrId, amount)
    }
  }
  function remove(id: string, amount: number) {
    const existItem = inventoryItemMap.get(id)
    if (existItem) {
      if (existItem.amount > amount) {
        existItem.amount -= amount
      } else {
        if (existItem.amount < amount) {
          console.error(`${id} amount ${existItem.amount} < ${amount}`)
        }
        inventoryItemMap.delete(id)
      }
    } else {
      console.error(`Not exist inventory item id ${id}`)
    }
  }

  return {
    inventoryItems,
    add,
    adds,
    remove,
  }
})

class InventoryItem {
  item: ShallowReactive<Item>

  constructor(
    item: Item,
    public amount: number,
  ) {
    this.item = shallowReactive(item)
  }
}
