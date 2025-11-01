import { defineStore } from 'pinia'
import { computed, shallowReactive, ref } from 'vue'
import type { Item } from '@/models/item'
import { InventoryItem } from '@/models/inventory/InventoryItem'
import { useGameConfigStore } from './gameConfig'
import { Effect } from '@/models/state/Effect'
import type { Equipment } from '@/models/item/Equipment'
import type { Chest } from '@/models/item/Chest'
import { XP_TABLE } from '@/constants'
import i18n from '@/i18n'
import { useNotificationStore } from './notification'

export const usePlayerStore = defineStore('player', () => {
  const gameConfigStore = useGameConfigStore()

  // ============ 技能状态管理 ============
  // 所有技能的经验值存储
  const skillsXp = ref<Record<string, number>>({})

  // ============ 装备槽状态管理 ============
  // 装备槽状态存储 - slotId -> equipmentId
  const equippedItems = ref<Record<string, string | null>>({})

  // ============ 背包状态管理 ============
  // Player inventory
  const inventoryMap = shallowReactive(new Map<string, InventoryItem>())

  // Computed properties
  const inventoryItems = computed(() =>
    Array.from(inventoryMap.values()).sort((a, b) => a.item.sort - b.item.sort),
  )

  function initializePlayer() {
    // Clear any existing data
    inventoryMap.clear()
    skillsXp.value = {}
    equippedItems.value = {}

    // Initialize with starting items if needed
    // This could be expanded to load from save data
  }

  // ============ 技能管理功能 ============

  // 获取技能经验值
  function getSkillXp(skillId: string): number {
    return skillsXp.value[skillId] ?? 0
  }

  // 设置技能经验值
  function setSkillXp(skillId: string, xp: number) {
    skillsXp.value[skillId] = xp
  }

  // 根据经验值计算等级
  function getLevelFromXp(xp: number): number {
    let left = 0
    let right = XP_TABLE.length - 1
    let result = 0
    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (XP_TABLE[mid] <= xp) {
        result = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
    return result
  }

  // 获取技能等级
  function getSkillLevel(skillId: string): number {
    return getLevelFromXp(getSkillXp(skillId))
  }

  // 获取升级所需剩余经验值
  function getRemainingXpForUpgrade(skillId: string): number {
    const currentXp = getSkillXp(skillId)
    const currentLevel = getLevelFromXp(currentXp)
    const nextLevelXp = XP_TABLE[currentLevel + 1] ?? Infinity
    return Math.max(0, nextLevelXp - currentXp)
  }

  // 获取升级进度 (0-1)
  function getUpgradeProgress(skillId: string): number {
    const currentXp = getSkillXp(skillId)
    const currentLevel = getLevelFromXp(currentXp)
    const currentLevelXp = XP_TABLE[currentLevel] ?? 0
    const nextLevelXp = XP_TABLE[currentLevel + 1] ?? Infinity

    if (nextLevelXp === Infinity) return 1

    return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)
  }

  // 添加技能经验值
  function addSkillXp(skillId: string, xp: number) {
    const previousLevel = getLevelFromXp(getSkillXp(skillId))
    const newXp = getSkillXp(skillId) + xp
    setSkillXp(skillId, newXp)
    const currentLevel = getLevelFromXp(newXp)

    // 升级通知
    if (currentLevel > previousLevel) {
      const notificationStore = useNotificationStore()
      const skillConfig = gameConfigStore.getSkillConfigById(skillId)
      if (skillConfig) {
        notificationStore.info('notification.levelUp', {
          skill: i18n.global.t(skillConfig.name),
          level: currentLevel,
        })
      }
    }
  }

  // 获取技能完整信息
  function getSkill(skillId: string) {
    const skillConfig = gameConfigStore.getSkillConfigById(skillId)
    if (!skillConfig) return undefined

    return {
      ...skillConfig,
      xp: getSkillXp(skillId),
      level: getSkillLevel(skillId),
      remainingXpForUpgrade: getRemainingXpForUpgrade(skillId),
      upgradeProgress: getUpgradeProgress(skillId),
      addXp: (xp: number) => addSkillXp(skillId, xp)
    }
  }

  // 获取所有技能列表
  const skillsList = computed(() => {
    return Array.from(gameConfigStore.allSkillConfigs)
      .map(config => getSkill(config.id))
      .filter((skill): skill is NonNullable<typeof skill> => skill !== undefined)
      .sort((a, b) => a.sort - b.sort)
  })

  // 重置特定技能
  function resetSkill(skillId: string) {
    setSkillXp(skillId, 0)
  }

  // 重置所有技能
  function resetAllSkills() {
    for (const skillId of Object.keys(skillsXp.value)) {
      resetSkill(skillId)
    }
  }

  // ============ 装备槽管理功能 ============

  // 获取装备槽中的装备ID
  function getEquippedItemId(slotId: string): string | null {
    return equippedItems.value[slotId] ?? null
  }

  // 获取装备槽中的装备对象
  function getEquippedItem(slotId: string): Equipment | null {
    const equipmentId = getEquippedItemId(slotId)
    if (!equipmentId) return null

    const item = gameConfigStore.getItemById(equipmentId)
    return item.isEquipment() ? (item as Equipment) : null
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
    const result: Record<string, Equipment | null> = {}
    for (const slotId in equippedItems.value) {
      result[slotId] = getEquippedItem(slotId)
    }
    return result
  })

  // ============ 背包管理功能 ============

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
    const slotId = equipment.slot.id

    // Unequip current equipment if any
    unequipSlot(slotId)

    // Apply equipment effects
    for (const inactiveEffect of equipment.effects) {
      const state = gameConfigStore.getStateById(inactiveEffect.state)
      const effect = new Effect(inactiveEffect.type, computed(() => inactiveEffect.value))
      state.addEffect(slotId, effect)
    }

    // Set equipment to slot
    setEquippedItem(slotId, equipment.id)

    // Remove from inventory
    removeItem(inventoryItem, 1)
  }

  function unequipSlot(slotId: string) {
    const currentEquipment = getEquippedItem(slotId)

    if (currentEquipment) {
      // Remove equipment effects
      for (const effect of currentEquipment.effects) {
        const state = gameConfigStore.getStateById(effect.state)
        state.removeEffect(slotId)
      }

      // Clear equipment from slot
      clearEquippedItem(slotId)

      // Add equipment back to inventory
      addItem(currentEquipment, 1)
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
    skillsList,
    skillsXp,

    // Methods - Player Management
    initializePlayer,

    // Methods - Inventory Management
    clearInventory,
    addItem,
    addManyItems,
    removeItem,
    removeManyItems,
    getInventoryItem,
    hasItem,

    // Methods - Equipment Management
    equipItem,
    unequipSlot,
    getEquippedItemId,
    getEquippedItem,
    setEquippedItem,
    clearEquippedItem,
    equippedSlots,

    // Methods - Chest Management
    openChest,

    // Methods - Skills Management
    getSkillXp,
    setSkillXp,
    addSkillXp,
    getSkillLevel,
    getRemainingXpForUpgrade,
    getUpgradeProgress,
    getSkill,
    resetSkill,
    resetAllSkills,
    getLevelFromXp
  }
})
