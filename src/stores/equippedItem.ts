import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useInventoryStore } from './inventory'
import { itemConfigMap } from '@/gameConfig'

export const useEquippedItemStore = defineStore('equippedItem', () => {
  const playerStore = useInventoryStore()
  const equippedItems = ref<Record<string, string | null>>(Object.create(null))

  // 获取装备槽中的装备ID
  function getEquippedItemId(slotId: string): string | null {
    return equippedItems.value[slotId] ?? null
  }

  // 获取装备槽中的装备对象
  function getEquippedItem(slotId: string): string | null {
    return getEquippedItemId(slotId)
  }

  // 设置装备槽的装备
  function setEquippedItem(slotId: string, equipmentId: string | null) {
    equippedItems.value[slotId] = equipmentId
  }

  // 清空装备槽
  function clearEquippedItem(slotId: string) {
    equippedItems.value[slotId] = null
  }

  // 获取所有装备槽信息
  const equippedSlots = computed(() => {
    const result: Record<string, string | null> = Object.create(null)
    for (const slotId in equippedItems.value) {
      result[slotId] = getEquippedItem(slotId)
    }
    return result
  })

  // Equipment management
  function equipItem(itemId: string) {
    const itemConfig = itemConfigMap[itemId]
    if (itemConfig.category !== 'equipment' || !itemConfig.equipment) {
      console.error(`Item ${itemConfig.id} is not equipment`)
      return
    }

    const slotId = itemConfig.equipment.slotId

    // Unequip current equipment if any
    unequipSlot(slotId)

    // Apply equipment effects to PropertyManager
    // for (const effect of item.equipment.effects) {
    // gameConfigStore.propertyManager.addModifier(effect.property, {
    //   sourceId: `equipment:${slotId}`,
    //   sourceName: item.name,
    //   type: effect.type,
    //   value: effect.value,
    // })
    // }

    // Set equipment to slot
    setEquippedItem(slotId, itemConfig.id)

    // Remove from inventory
    playerStore.removeItem(itemConfig.id, 1)
  }

  function unequipSlot(slotId: string) {
    const currentEquipment = getEquippedItem(slotId)

    if (currentEquipment) {
      // Remove all modifiers from this equipment
      // gameConfigStore.propertyManager.removeAllModifiersFromSource(`equipment:${slotId}`)

      // Clear equipment from slot
      clearEquippedItem(slotId)

      // Add equipment back to inventory
      playerStore.addItem(currentEquipment, 1)
    }
  }


  return {
    getEquippedItemId,
    getEquippedItem,
    setEquippedItem,
    clearEquippedItem,
    equippedSlots,
    equipItem,
    unequipSlot,
  }
})
