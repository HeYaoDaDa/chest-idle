import { defineStore } from 'pinia'
import { computed, markRaw, ref } from 'vue'
import type { GameConfig } from '@/models/gameConfig'
import type { ActionConfig } from '@/models/gameConfig/ActionConfig'
import type { ItemConfig } from '@/models/gameConfig/ItemConfig'
import type { EffectConfig } from '@/models/gameConfig/misc/EffectConfig'
import type { SkillConfig } from '@/models/Skill'
import type { Slot } from '@/models/Slot'
import { Item, type ItemWithLootDefs } from '@/models/item'
import { Action } from '@/models/Action'
import { PropertyManager } from '@/models/property'

export const useGameConfigStore = defineStore('gameConfig', () => {
  // Maps for storing game objects by ID
  const skillConfigMap = new Map<string, SkillConfig>()
  const slotMap = new Map<string, Slot>()
  const itemMap = new Map<string, Item>()
  const chestMap = new Map<string, Item>()
  const actionMap = new Map<string, Action>()

  // 新的属性管理器
  const propertyManager = new PropertyManager()

  // Cached arrays for UI consumption
  const allSkillConfigs = ref<SkillConfig[]>([])
  const allSlots = ref<Slot[]>([])
  const allChests = ref<Item[]>([])

  const defaultSkillPagePath = computed(() => {
    if (allSkillConfigs.value.length > 0) {
      const firstSkillId = allSkillConfigs.value[0].id
      return `/game/${firstSkillId}`
    }
    return undefined
  })

  function clear() {
    skillConfigMap.clear()
    slotMap.clear()
    itemMap.clear()
    chestMap.clear()
    actionMap.clear()
    propertyManager.clear()
    allSkillConfigs.value = []
    allSlots.value = []
    allChests.value = []
  }

  function handleGameConfig(gameConfig: GameConfig) {
    switch (gameConfig.type) {
      case 'skill': {
        const skillConfig: SkillConfig = {
          id: gameConfig.id,
          name: `skill.${gameConfig.id}.name`,
          description: `skill.${gameConfig.id}.description`,
          sort: gameConfig.sort
        }
        skillConfigMap.set(skillConfig.id, skillConfig)
        break
      }
      case 'slot': {
        const slot = markRaw({
          id: gameConfig.id,
          sort: gameConfig.sort,
          name: `slot.${gameConfig.id}`
        })
        slotMap.set(slot.id, slot)
        break
      }
      case 'item': {
        const itemDef = gameConfig as ItemConfig
        const equipment = 'equipment' in itemDef && itemDef.equipment ? {
          slot: getSlotById(itemDef.equipment.slot),
          effects: itemDef.equipment.effects.map((it: EffectConfig) => ({
            property: it.property,
            type: it.type,
            value: it.value,
          }))
        } : null

        const chest = 'chest' in itemDef && itemDef.chest ? {
          maxPoints: itemDef.chest.maxPoints,
          loots: [] // Will be populated in buildCaches
        } : null

        const item = markRaw(new Item(
          gameConfig.id,
          gameConfig.sort,
          gameConfig.category,
          equipment,
          chest
        ))

        // Store loot config temporarily for later resolution
        if (chest && itemDef.chest) {
          (item as ItemWithLootDefs)._lootDefs = itemDef.chest.loots
          chestMap.set(item.id, item)
        }

        itemMap.set(item.id, item)
        break
      }
      case 'action': {
        const actionConfig = gameConfig as ActionConfig
        const skillId = actionConfig.skill
        const chest = getChestById(actionConfig.chest)

        const products = actionConfig.products.map(({ item, count }) => ({
          item: getItemById(item),
          count,
        }))

        const ingredients = actionConfig.ingredients?.map(({ item, count }) => ({
          item: getItemById(item),
          count,
        })) ?? []
        const action = markRaw(
          new Action(
            actionConfig.id,
            skillId,
            actionConfig.tab,
            actionConfig.minLevel,
            actionConfig.sort,
            actionConfig.duration,
            actionConfig.xp,
            chest,
            actionConfig.chestPoints,
            ingredients,
            products,
            propertyManager,
          ),
        )

        actionMap.set(action.id, action)
        break
      }
      default:
        break
    }
  }

  function buildCaches() {
    // Build item relationships - resolve chest loot items
    for (const item of itemMap.values()) {
      if (item.isChest() && item.chest) {
        const itemWithDefs = item as ItemWithLootDefs
        const lootDefs = itemWithDefs._lootDefs
        if (lootDefs) {
          item.chest.loots = lootDefs.map((it) => ({
            item: getItemById(it.item),
            chance: it.chance,
            min: it.min,
            max: it.max,
          }))
          // Clean up temporary storage
          delete itemWithDefs._lootDefs
        }
      }
    }

    // Update cached arrays
    allSkillConfigs.value = Array.from(skillConfigMap.values()).sort((a, b) => a.sort - b.sort)
    allSlots.value = Array.from(slotMap.values()).sort((a, b) => a.sort - b.sort)
    allChests.value = Array.from(chestMap.values()).sort((a, b) => a.sort - b.sort)
  }

  function loadGameConfig(gameConfigs: GameConfig[]) {
    clear()
    for (const gameConfig of gameConfigs) {
      handleGameConfig(gameConfig)
    }
    buildCaches()
  }

  /**
   * Load game configuration via Vite glob import from source files.
   * Auto-discovers all JSON under /src/data/** and loads them.
   * Ensures config processing order to satisfy dependencies.
   */
  async function loadGameConfigFromGlob() {
    const modules = import.meta.glob('/src/data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

    const all: GameConfig[] = []
    for (const mod of Object.values(modules)) {
      const data = mod as unknown
      if (Array.isArray(data)) {
        all.push(...(data as GameConfig[]))
      } else if (data && typeof data === 'object') {
        all.push(data as GameConfig)
      }
    }

    // Ensure stable order: skills -> slots -> items -> actions
    const typeOrder: Record<GameConfig['type'], number> = {
      skill: 1,
      slot: 2,
      item: 3,
      action: 4,
    }
    const sorted = all.slice().sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

    loadGameConfig(sorted)
  }

  // Getter functions
  // 获取技能的相关 Actions
  function getSkillActions(skillId: string): Action[] {
    return Array.from(actionMap.values())
      .filter(action => action.skillId === skillId)
      .sort((a, b) => a.sort - b.sort)
  }

  // 获取技能的 Action 标签页映射
  function getSkillActionTabs(skillId: string): Map<string, Action[]> {
    const tabMap = new Map<string, Action[]>()
    const actions = getSkillActions(skillId)

    for (const action of actions) {
      if (action.tab) {
        const list = tabMap.get(action.tab) ?? []
        if (!tabMap.has(action.tab)) {
          tabMap.set(action.tab, list)
        }
        list.push(action)
      }
    }

    // 排序每个标签页中的 actions
    for (const list of tabMap.values()) {
      list.sort((a, b) => a.sort - b.sort)
    }

    return tabMap
  }

  function getSkillConfigById(skillId: string): SkillConfig | undefined {
    return skillConfigMap.get(skillId)
  }

  function getSlotById(id: string): Slot {
    const slot = slotMap.get(id)
    if (!slot) {
      throw new Error(`Slot ${id} not found`)
    }
    return slot
  }

  function getItemById(id: string): Item {
    const item = itemMap.get(id)
    if (!item) {
      throw new Error(`Item ${id} not found`)
    }
    return item
  }

  function getChestById(id: string): Item {
    const chest = chestMap.get(id)
    if (!chest) {
      throw new Error(`Chest ${id} not found`)
    }
    return chest
  }

  function getActionById(id: string): Action {
    const action = actionMap.get(id)
    if (!action) {
      throw new Error(`Action ${id} not found`)
    }
    return action
  }

  return {
    // State
    allSkillConfigs,
    allSlots,
    allChests,
    propertyManager,

    // Computed
    defaultSkillPagePath,

    // Methods
    loadGameConfig,
    loadGameConfigFromGlob,
    getSkillConfigById,
    getSkillActions,
    getSkillActionTabs,
    getSlotById,
    getItemById,
    getChestById,
    getActionById,
  }
})
