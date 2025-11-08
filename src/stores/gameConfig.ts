import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { Definition } from '@/models/definitions'
import type { ActionTargetDefinition } from '@/models/definitions/actionTarget'
import type { ItemDefinition } from '@/models/definitions/item'
import type { EffectDefinition } from '@/models/definitions/misc/EffectDefinition'
import type { SkillConfig } from '@/models/Skill'
import type { Slot } from '@/models/Slot'
import { Item, type ItemWithLootDefs } from '@/models/item'
import { ActionTarget } from '@/models/actionTarget'
import { PropertyManager } from '@/models/property'
import { usePlayerStore } from './player'

export const useGameConfigStore = defineStore('gameConfig', () => {
  // Maps for storing game objects by ID
  const skillConfigMap = new Map<string, SkillConfig>()
  const slotMap = new Map<string, Slot>()
  const itemMap = new Map<string, Item>()
  const chestMap = new Map<string, Item>()
  const actionTargetMap = new Map<string, ActionTarget>()

  // 新的属性管理器
  const propertyManager = new PropertyManager()

  // Cached arrays for UI consumption
  const allSkillConfigs = ref<SkillConfig[]>([])
  const allSlots = ref<Slot[]>([])
  const allChests = ref<Item[]>([])

  function clear() {
    skillConfigMap.clear()
    slotMap.clear()
    itemMap.clear()
    chestMap.clear()
    actionTargetMap.clear()
    propertyManager.clear()
    allSkillConfigs.value = []
    allSlots.value = []
    allChests.value = []
  }

  function handleDefinition(definition: Definition) {
    switch (definition.type) {
      case 'skill': {
        const skillConfig: SkillConfig = {
          id: definition.id,
          name: `skill.${definition.id}.name`,
          description: `skill.${definition.id}.description`,
          sort: definition.sort
        }
        skillConfigMap.set(skillConfig.id, skillConfig)
        break
      }
      case 'slot': {
        const slot = markRaw({
          id: definition.id,
          sort: definition.sort,
          name: `slot.${definition.id}`
        })
        slotMap.set(slot.id, slot)
        break
      }
      case 'item': {
        const itemDef = definition as ItemDefinition
        const equipment = 'equipment' in itemDef && itemDef.equipment ? {
          slot: getSlotById(itemDef.equipment.slot),
          effects: itemDef.equipment.effects.map((it: EffectDefinition) => ({
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
          definition.id,
          definition.sort,
          definition.category,
          equipment,
          chest
        ))

        // Store loot definitions temporarily for later resolution
        if (chest && itemDef.chest) {
          ;(item as ItemWithLootDefs)._lootDefs = itemDef.chest.loots
          chestMap.set(item.id, item)
        }

        itemMap.set(item.id, item)
        break
      }
      case 'actionTarget': {
        const actionTargetDefinition = definition as ActionTargetDefinition
        const playerStore = usePlayerStore()
        const skillId = actionTargetDefinition.skill
        const chest = getChestById(actionTargetDefinition.chest)

        const products = actionTargetDefinition.products.map(({ item, count }) => ({
          item: getItemById(item),
          count,
        }))

        const ingredients = actionTargetDefinition.ingredients?.map(({ item, count }) => ({
          item: getItemById(item),
          count,
        })) ?? []
        const actionTarget = markRaw(
          new ActionTarget(
            actionTargetDefinition.id,
            skillId,
            actionTargetDefinition.tab,
            actionTargetDefinition.minLevel,
            actionTargetDefinition.sort,
            actionTargetDefinition.duration,
            actionTargetDefinition.xp,
            chest,
            actionTargetDefinition.chestPoints,
            ingredients,
            products,
            () => playerStore.getSkillLevel(skillId),
            propertyManager,
          ),
        )

        actionTargetMap.set(actionTarget.id, actionTarget)
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

  function loadGameConfig(definitions: Definition[]) {
    clear()
    for (const definition of definitions) {
      handleDefinition(definition)
    }
    buildCaches()
  }

  /**
   * Load game configuration via Vite glob import from source files.
   * Auto-discovers all JSON under /src/data/** and loads them.
   * Ensures definition processing order to satisfy dependencies.
   */
  async function loadGameConfigFromGlob() {
    const modules = import.meta.glob('/src/data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

    const all: Definition[] = []
    for (const mod of Object.values(modules)) {
      const data = mod as unknown
      if (Array.isArray(data)) {
        all.push(...(data as Definition[]))
      } else if (data && typeof data === 'object') {
        all.push(data as Definition)
      }
    }

    // Ensure stable order: skills -> slots -> items -> actionTarget
    const typeOrder: Record<Definition['type'], number> = {
      skill: 1,
      slot: 2,
      item: 3,
      actionTarget: 4,
    }
    const sorted = all.slice().sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

    loadGameConfig(sorted)
  }

  // Getter functions
  // 获取技能的相关 ActionTargets
  function getSkillActionTargets(skillId: string): ActionTarget[] {
    return Array.from(actionTargetMap.values())
      .filter(actionTarget => actionTarget.skillId === skillId)
      .sort((a, b) => a.sort - b.sort)
  }

  // 获取技能的 ActionTarget 标签页映射
  function getSkillActionTargetTabs(skillId: string): Map<string, ActionTarget[]> {
    const tabMap = new Map<string, ActionTarget[]>()
    const actionTargets = getSkillActionTargets(skillId)

    for (const actionTarget of actionTargets) {
      if (actionTarget.tab) {
        const list = tabMap.get(actionTarget.tab) ?? []
        if (!tabMap.has(actionTarget.tab)) {
          tabMap.set(actionTarget.tab, list)
        }
        list.push(actionTarget)
      }
    }

    // 排序每个标签页中的 actionTargets
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

  function getActionTargetById(id: string): ActionTarget {
    const actionTarget = actionTargetMap.get(id)
    if (!actionTarget) {
      throw new Error(`ActionTarget ${id} not found`)
    }
    return actionTarget
  }

  return {
    // State
    allSkillConfigs,
    allSlots,
    allChests,
    propertyManager,

    // Methods
    loadGameConfig,
    loadGameConfigFromGlob,
    getSkillConfigById,
    getSkillActionTargets,
    getSkillActionTargetTabs,
    getSlotById,
    getItemById,
    getChestById,
    getActionTargetById,
  }
})
