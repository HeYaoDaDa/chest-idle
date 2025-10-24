import { computed, shallowReactive } from 'vue'
import type { Item } from '../item'
import { InventoryItem } from '../inventory/InventoryItem'
import { dataManager } from './DataManager'

class InventoryManager {
  public inventoryItemMap = shallowReactive(new Map<string, InventoryItem>())
  public inventoryItems = computed(() =>
    Array.from(this.inventoryItemMap.values()).sort((a, b) => a.item.sort - b.item.sort),
  )

  public load() {}

  public add(itemOrId: Item | string, amount: number) {
    let item
    if (typeof itemOrId === 'string') {
      item = dataManager.getItemById(itemOrId)
    } else {
      item = itemOrId
    }
    const existItem = this.inventoryItemMap.get(item.id)
    if (existItem) {
      existItem.amount.value += amount
    } else {
      this.inventoryItemMap.set(item.id, new InventoryItem(item, amount))
    }
  }

  public addes(items: [Item | string, number][]) {
    for (const [itemOrId, amount] of items) {
      this.add(itemOrId, amount)
    }
  }

  public remove(itemOrId: InventoryItem | string, amount: number) {
    let existItem
    if (typeof itemOrId === 'string') {
      existItem = this.inventoryItemMap.get(itemOrId)
      if (existItem === undefined) {
        console.error(`Not exist item id ${itemOrId}`)
        return
      }
    } else {
      existItem = itemOrId
    }
    const id = existItem.item.id
    if (existItem) {
      if (existItem.amount.value > amount) {
        existItem.amount.value -= amount
      } else {
        if (existItem.amount.value < amount) {
          console.error(`${id} amount ${existItem.amount} < ${amount}`)
        }
        this.inventoryItemMap.delete(id)
      }
    } else {
      console.error(`Not exist inventory item id ${id}`)
    }
  }

  public removes(items: [InventoryItem | string, number][]) {
    for (const [itemOrId, amount] of items) {
      this.remove(itemOrId, amount)
    }
  }
}

export const inventory = new InventoryManager()
