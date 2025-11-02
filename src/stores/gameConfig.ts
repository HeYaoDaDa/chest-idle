import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { Definition } from '@/models/definitions'
import type { ActionTargetDefinition } from '@/models/definitions/actionTarget'
import type { RecipeDefinition } from '@/models/definitions/actionTarget/RecipeDefinition'
import type { SkillConfig } from '@/models/Skill'
import { State } from '@/models/state/State'
import type { Slot } from '@/models/Slot'
import type { Item } from '@/models/item'
import { Resource } from '@/models/item/Resource'
import { Chest } from '@/models/item/Chest'
import { Equipment } from '@/models/item/Equipment'
import type { ActionTarget } from '@/models/actionTarget'
import { GatheringZone } from '@/models/actionTarget/GatheringZone'
import { Recipe } from '@/models/actionTarget/Recipe'
import { usePlayerStore } from './player'

export const useGameConfigStore = defineStore('gameConfig', () => {
  // Maps for storing game objects by ID
  const skillConfigMap = new Map<string, SkillConfig>()
  const stateMap = new Map<string, State>()
  const slotMap = new Map<string, Slot>()
  const itemMap = new Map<string, Item>()
  const chestMap = new Map<string, Chest>()
  const actionTargetMap = new Map<string, ActionTarget>()

  // Cached arrays for UI consumption
  const allSkillConfigs = ref<SkillConfig[]>([])
  const allSlots = ref<Slot[]>([])
  const allChests = ref<Chest[]>([])

  function clear() {
    skillConfigMap.clear()
    stateMap.clear()
    slotMap.clear()
    itemMap.clear()
    chestMap.clear()
    actionTargetMap.clear()
    allSkillConfigs.value = []
    allSlots.value = []
    allChests.value = []
  }

  function resolveState(id: string): State {
    const state = stateMap.get(id)
    if (!state) {
      throw new Error(`State ${id} not found`)
    }
    return state
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
      case 'state': {
        const state = markRaw(new State(definition.base))
        stateMap.set(definition.id, state)
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
        let item: Item
        if (definition.itemType === 'resource') {
          item = markRaw(new Resource(definition.id, definition.sort))
        } else if (definition.itemType === 'chest') {
          const chest = markRaw(
            new Chest(definition.id, definition.sort, definition.maxPoints, definition.loots),
          )
          chestMap.set(chest.id, chest)
          item = chest
        } else if (definition.itemType === 'equipment') {
          const slot = getSlotById(definition.slot)
          item = markRaw(new Equipment(definition.id, definition.sort, slot, definition.effects))
        } else {
          const itemType = (definition as { itemType: string }).itemType
          throw new Error(`Unknown item type ${itemType}`)
        }
        itemMap.set(item.id, item)
        break
      }
      case 'actionTarget': {
        const actionTargetDefinition = definition as ActionTargetDefinition
        const playerStore = usePlayerStore()
        const skill = playerStore.getSkill(actionTargetDefinition.skill)
        if (!skill) {
          throw new Error(`Skill ${actionTargetDefinition.skill} not found`)
        }
        const chest = getChestById(actionTargetDefinition.chest)

        const products = actionTargetDefinition.products.map(({ item, count }) => ({
          item: getItemById(item),
          count,
        }))

        let actionTarget: ActionTarget

        if (actionTargetDefinition.targetType === 'gatheringZone') {
          actionTarget = markRaw(
            new GatheringZone(
              actionTargetDefinition.id,
              skill,
              actionTargetDefinition.tab,
              actionTargetDefinition.minLevel,
              actionTargetDefinition.sort,
              actionTargetDefinition.duration,
              actionTargetDefinition.xp,
              chest,
              actionTargetDefinition.chestPoints,
              products,
              resolveState,
            ),
          )
        } else if (actionTargetDefinition.targetType === 'recipe') {
          const recipeDefinition = actionTargetDefinition as RecipeDefinition
          const ingredients = recipeDefinition.ingredients.map(({ item, count }) => ({
            item: getItemById(item),
            count,
          }))
          actionTarget = markRaw(
            new Recipe(
              recipeDefinition.id,
              skill,
              recipeDefinition.tab,
              recipeDefinition.minLevel,
              recipeDefinition.sort,
              recipeDefinition.duration,
              recipeDefinition.xp,
              chest,
              recipeDefinition.chestPoints,
              ingredients,
              products,
              resolveState,
            ),
          )
        } else {
          const targetType = (actionTargetDefinition as { targetType: string }).targetType
          throw new Error(`Unknown action target type ${targetType}`)
        }

        actionTargetMap.set(actionTarget.id, actionTarget)
        break
      }
      default:
        break
    }
  }

  function buildCaches() {
    // Build item relationships
    for (const item of itemMap.values()) {
      if (item.isChest()) {
        item.loots = item.lootDefinitions.map((it) => ({
          ...it,
          item: getItemById(it.item),
        }))
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

    // Ensure stable order: skills -> states -> slots -> items -> actionTarget
    const typeOrder: Record<Definition['type'], number> = {
      skill: 1,
      state: 2,
      slot: 3,
      item: 4,
      actionTarget: 5,
    }
    const sorted = all.slice().sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

    loadGameConfig(sorted)
  }

  // Getter functions
  // 获取技能的相关 ActionTargets
  function getSkillActionTargets(skillId: string): ActionTarget[] {
    return Array.from(actionTargetMap.values())
      .filter(actionTarget => actionTarget.skill.id === skillId)
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

  function getStateById(id: string): State {
    const state = stateMap.get(id)
    if (!state) {
      throw new Error(`State ${id} not found`)
    }
    return state
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

  function getChestById(id: string): Chest {
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

  function getAllStates(): Array<[string, State]> {
    return Array.from(stateMap.entries())
  }

  return {
    // State
    allSkillConfigs,
    allSlots,
    allChests,

    // Methods
    loadGameConfig,
    loadGameConfigFromGlob,
    getSkillConfigById,
    getSkillActionTargets,
    getSkillActionTargetTabs,
    getStateById,
    getSlotById,
    getItemById,
    getChestById,
    getActionTargetById,
    getAllStates,
  }
})
