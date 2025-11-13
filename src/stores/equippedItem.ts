import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useInventoryStore } from './inventory'
import { useStatStore } from './stat'
import { itemConfigMap, slotConfigs } from '@/gameConfig'

export const useEquippedItemStore = defineStore('equippedItem', () => {
  const inventoryStore = useInventoryStore()
  const statStore = useStatStore()
  const equippedItems = ref<Record<string, string | null>>(Object.create(null))

  // 获取装备槽中的装备ID
  function getEquippedItem(slotId: string): string | null {
    return equippedItems.value[slotId] ?? null
  }

  // 设置装备槽的装备
  function setEquippedItem(slotId: string, equipmentId: string | null): void {
    equippedItems.value[slotId] = equipmentId
  }

  // 清空装备槽
  function clearEquippedItem(slotId: string): void {
    equippedItems.value[slotId] = null
  }

  // 获取所有槽位的装备映射（用于UI展示）
  const equippedBySlot = computed<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {}
    for (const slot of slotConfigs) {
      map[slot.id] = getEquippedItem(slot.id)
    }
    return map
  })

  // Equipment management
  function equipItem(itemId: string): void {
    const itemConfig = itemConfigMap[itemId]
    if (itemConfig.category !== 'equipment' || !itemConfig.equipment) {
      console.error(`Item ${itemConfig.id} is not equipment`)
      return
    }

    const slotId = itemConfig.equipment.slotId

    // Unequip current equipment if any
    unequipSlot(slotId)

    // Apply equipment effects to stat store
    if (itemConfig.equipment.effects && itemConfig.equipment.effects.length > 0) {
      const effects = itemConfig.equipment.effects.map(effect => ({
        statId: effect.statId,
        type: effect.type,
        value: effect.value,
      }))
      statStore.addEffectsFromSource(`equipment:${slotId}`, effects)
    }

    // Set equipment to slot
    setEquippedItem(slotId, itemConfig.id)

    // Remove from inventory
    inventoryStore.removeItem(itemConfig.id, 1)
  }

  function unequipSlot(slotId: string): void {
    const currentEquipment = getEquippedItem(slotId)

    if (currentEquipment) {
      // Remove all equipment effects from stat store
      statStore.removeEffectsFromSource(`equipment:${slotId}`)

      // Clear equipment from slot
      clearEquippedItem(slotId)

      // Add equipment back to inventory
      inventoryStore.addItem(currentEquipment, 1)
    }
  }


  return {
    equippedItems,
    equippedBySlot,
    getEquippedItem,
    setEquippedItem,
    clearEquippedItem,
    equipItem,
    unequipSlot,
  }
})
