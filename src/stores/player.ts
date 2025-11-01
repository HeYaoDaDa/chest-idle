import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'
import type { Item } from '@/models/item'
import { InventoryItem } from '@/models/inventory/InventoryItem'
import { useGameConfigStore } from './gameConfig'
import { Effect } from '@/models/state/Effect'
import type { Equipment } from '@/models/item/Equipment'
import type { Chest } from '@/models/item/Chest'

export const usePlayerStore = defineStore('player', () => {
  const gameConfigStore = useGameConfigStore()

  // Player inventory
  const inventoryMap = shallowReactive(new Map<string, InventoryItem>())

  // Computed properties
  const inventoryItems = computed(() =>
    Array.from(inventoryMap.values()).sort((a, b) => a.item.sort - b.item.sort),
  )

  function initializePlayer() {
    // Clear any existing data
    inventoryMap.clear()

    // Initialize with starting items if needed
    // This could be expanded to load from save data
  }

  function clearInventory() {
    inventoryMap.clear()
  }

  function addItem(itemOrId: Item | string, amount: number) {
    const item = typeof itemOrId === 'string' ? gameConfigStore.getItemById(itemOrId) : itemOrId
    const existingItem = inventoryMap.get(item.id)

    if (existingItem) {
      existingItem.amount.value += amount
    } else {
      inventoryMap.set(item.id, new InventoryItem(item, amount))
    }
  }

  function addManyItems(items: [Item | string, number][]) {
    for (const [itemOrId, amount] of items) {
      addItem(itemOrId, amount)
    }
  }

  function removeItem(itemOrId: InventoryItem | string, amount: number) {
    const entry = typeof itemOrId === 'string'
      ? inventoryMap.get(itemOrId)
      : inventoryMap.get(itemOrId.item.id)

    if (!entry) {
      console.error(`Inventory item not found: ${typeof itemOrId === 'string' ? itemOrId : itemOrId.item.id}`)
      return
    }

    if (entry.amount.value > amount) {
      entry.amount.value -= amount
    } else {
      if (entry.amount.value < amount) {
        console.error(`Insufficient amount for ${entry.item.id}: have ${entry.amount.value}, need ${amount}`)
      }
      inventoryMap.delete(entry.item.id)
    }
  }

  function removeManyItems(items: [InventoryItem | string, number][]) {
    for (const [itemOrId, amount] of items) {
      removeItem(itemOrId, amount)
    }
  }

  function getInventoryItem(itemId: string): InventoryItem | undefined {
    return inventoryMap.get(itemId)
  }

  function hasItem(itemId: string, amount: number = 1): boolean {
    const item = inventoryMap.get(itemId)
    return item ? item.amount.value >= amount : false
  }

  // Equipment management
  function equipItem(inventoryItem: InventoryItem) {
    if (!inventoryItem.item.isEquipment()) {
      console.error(`Item ${inventoryItem.item.id} is not equipment`)
      return
    }

    const equipment = inventoryItem.item as Equipment
    const slot = equipment.slot

    // Unequip current equipment if any
    unequipSlot(slot.id)

    // Apply equipment effects
    for (const inactiveEffect of equipment.effects) {
      const state = gameConfigStore.getStateById(inactiveEffect.state)
      const effect = new Effect(inactiveEffect.type, computed(() => inactiveEffect.value))
      state.addEffect(slot.id, effect)
    }

    // Set equipment to slot
    slot.setEquipment(equipment)

    // Remove from inventory
    removeItem(inventoryItem, 1)
  }

  function unequipSlot(slotId: string) {
    const slot = gameConfigStore.getSlotById(slotId)

    if (slot.currentEquipment) {
      // Remove equipment effects
      for (const effect of slot.currentEquipment.effects) {
        const state = gameConfigStore.getStateById(effect.state)
        state.removeEffect(slot.id)
      }

      // Add equipment back to inventory
      const equipment = slot.currentEquipment
      slot.clearEquipment()
      addItem(equipment, 1)
    }
  }

  // Chest opening
  function openChest(inventoryItem: InventoryItem, amount: number = 1): { itemName: string; amount: number }[] {
    if (!inventoryItem.item.isChest()) {
      console.error(`Item ${inventoryItem.item.id} is not a chest`)
      return []
    }

    const chest = inventoryItem.item as Chest
    const results: { itemName: string; amount: number }[] = []

    // Remove chests from inventory
    removeItem(inventoryItem, amount)

    // Roll loot for each chest
    for (let i = 0; i < amount; i++) {
      const lootResults = InventoryItem.rollLoot(chest)

      for (const { itemId, amount: lootAmount } of lootResults) {
        addItem(itemId, lootAmount)

        // Track results for display
        const existingResult = results.find(r => r.itemName === `item.${itemId}.name`)
        if (existingResult) {
          existingResult.amount += lootAmount
        } else {
          results.push({ itemName: `item.${itemId}.name`, amount: lootAmount })
        }
      }
    }

    return results
  }

  return {
    // State
    inventoryItems,
    inventoryMap,

    // Methods
    initializePlayer,
    clearInventory,
    addItem,
    addManyItems,
    removeItem,
    removeManyItems,
    getInventoryItem,
    hasItem,
    equipItem,
    unequipSlot,
    openChest,
  }
})
