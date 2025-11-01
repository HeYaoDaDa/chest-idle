import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { Definition } from '@/models/definitions'
import type { ActionTargetDefinition } from '@/models/definitions/actionTarget'
import type { RecipeDefinition } from '@/models/definitions/actionTarget/RecipeDefinition'
import { Skill } from '@/models/Skill'
import { State } from '@/models/state/State'
import { Slot } from '@/models/Slot'
import type { Item } from '@/models/item'
import { Resource } from '@/models/item/Resource'
import { Chest } from '@/models/item/Chest'
import { Equipment } from '@/models/item/Equipment'
import type { ActionTarget } from '@/models/actionTarget'
import { GatheringZone } from '@/models/actionTarget/GatheringZone'
import { Recipe } from '@/models/actionTarget/Recipe'

export const useGameConfigStore = defineStore('gameConfig', () => {
  // Maps for storing game objects by ID
  const skillMap = new Map<string, Skill>()
  const stateMap = new Map<string, State>()
  const slotMap = new Map<string, Slot>()
  const itemMap = new Map<string, Item>()
  const chestMap = new Map<string, Chest>()
  const actionTargetMap = new Map<string, ActionTarget>()

  // Cached arrays for UI consumption
  const allSkills = ref<Skill[]>([])
  const allSlots = ref<Slot[]>([])
  const allChests = ref<Chest[]>([])

  function clear() {
    skillMap.clear()
    stateMap.clear()
    slotMap.clear()
    itemMap.clear()
    chestMap.clear()
    actionTargetMap.clear()
    allSkills.value = []
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
        const skill = markRaw(new Skill(definition.id, definition.sort))
        skillMap.set(skill.id, skill)
        break
      }
      case 'state': {
        const state = markRaw(new State(definition.base))
        stateMap.set(definition.id, state)
        break
      }
      case 'slot': {
        const slot = markRaw(new Slot(definition.id, definition.sort))
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
        const skill = getSkillById(actionTargetDefinition.skill)
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
        item.loots = item._loots.map((it) => ({
          ...it,
          item: getItemById(it.item),
        }))
      }
    }

    // Build skill relationships
    for (const skill of skillMap.values()) {
      skill.actionTargets = []
      skill.actionTargetTabMap.clear()
    }

    for (const actionTarget of actionTargetMap.values()) {
      const skill = actionTarget.skill
      skill.actionTargets.push(actionTarget)
      if (actionTarget.tab) {
        const list = skill.actionTargetTabMap.get(actionTarget.tab) ?? []
        if (!skill.actionTargetTabMap.has(actionTarget.tab)) {
          skill.actionTargetTabMap.set(actionTarget.tab, list)
        }
        list.push(actionTarget)
      }
    }

    // Sort everything
    for (const skill of skillMap.values()) {
      skill.actionTargets.sort((a, b) => a.sort - b.sort)
      for (const list of skill.actionTargetTabMap.values()) {
        list.sort((a, b) => a.sort - b.sort)
      }
    }

    // Update cached arrays
    allSkills.value = Array.from(skillMap.values()).sort((a, b) => a.sort - b.sort)
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

  // Getter functions
  function getSkillById(id: string): Skill {
    const skill = skillMap.get(id)
    if (!skill) {
      throw new Error(`Skill ${id} not found`)
    }
    return skill
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

  return {
    // State
    allSkills,
    allSlots,
    allChests,

    // Methods
    loadGameConfig,
    getSkillById,
    getStateById,
    getSlotById,
    getItemById,
    getChestById,
    getActionTargetById,

    // Internal maps (for compatibility)
    skillMap,
    stateMap,
  }
})
