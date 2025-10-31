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

export const useDataStore = defineStore('data', () => {
  const skillIdMap = new Map<string, Skill>()
  const stateIdMap = new Map<string, State>()
  const slotIdMap = new Map<string, Slot>()
  const itemIdMap = new Map<string, Item>()
  const chestIdMap = new Map<string, Chest>()
  const actionTargetIdMap = new Map<string, ActionTarget>()

  const allSkill = ref<Skill[]>([])
  const allSlot = ref<Slot[]>([])
  const allChest = ref<Chest[]>([])

  function clear() {
    skillIdMap.clear()
    stateIdMap.clear()
    slotIdMap.clear()
    itemIdMap.clear()
    chestIdMap.clear()
    actionTargetIdMap.clear()
    allSkill.value = []
    allSlot.value = []
    allChest.value = []
  }

  function resolveState(id: string): State {
    const state = stateIdMap.get(id)
    if (!state) {
      throw new Error(`state ${id} not found`)
    }
    return state
  }

  function handleDefinition(definition: Definition) {
    switch (definition.type) {
      case 'skill': {
        const skill = markRaw(new Skill(definition.id, definition.sort))
        skillIdMap.set(skill.id, skill)
        break
      }
      case 'state': {
        const state = markRaw(new State(definition.base))
        stateIdMap.set(definition.id, state)
        break
      }
      case 'slot': {
        const slot = markRaw(new Slot(definition.id, definition.sort))
        slotIdMap.set(slot.id, slot)
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
          chestIdMap.set(chest.id, chest)
          item = chest
        } else if (definition.itemType === 'equipment') {
          const slot = getSlotById(definition.slot)
          item = markRaw(new Equipment(definition.id, definition.sort, slot, definition.effects))
        } else {
          const itemType = (definition as { itemType: string }).itemType
          throw new Error(`Unknown item type ${itemType}`)
        }
        itemIdMap.set(item.id, item)
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

        actionTargetIdMap.set(actionTarget.id, actionTarget)
        break
      }
      default:
        break
    }
  }

  function rebuildCaches() {
    for (const item of itemIdMap.values()) {
      if (item.isChest()) {
        item.loots = item._loots.map((it) => ({
          ...it,
          item: getItemById(it.item),
        }))
      }
    }

    for (const skill of skillIdMap.values()) {
      skill.actionTargets = []
      skill.actionTargetTabMap.clear()
    }

    for (const actionTarget of actionTargetIdMap.values()) {
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

    for (const skill of skillIdMap.values()) {
      skill.actionTargets.sort((a, b) => a.sort - b.sort)
      for (const list of skill.actionTargetTabMap.values()) {
        list.sort((a, b) => a.sort - b.sort)
      }
    }

    allSkill.value = Array.from(skillIdMap.values()).sort((a, b) => a.sort - b.sort)
    allSlot.value = Array.from(slotIdMap.values()).sort((a, b) => a.sort - b.sort)
    allChest.value = Array.from(chestIdMap.values()).sort((a, b) => a.sort - b.sort)
  }

  function load(definitions: Definition[]) {
    clear()
    for (const definition of definitions) {
      handleDefinition(definition)
    }
    rebuildCaches()
  }

  function getSkillById(id: string): Skill {
    const skill = skillIdMap.get(id)
    if (!skill) {
      throw new Error(`skill ${id} not found`)
    }
    return skill
  }

  function getStateById(id: string): State {
    const state = stateIdMap.get(id)
    if (!state) {
      throw new Error(`state ${id} not found`)
    }
    return state
  }

  function getSlotById(id: string): Slot {
    const slot = slotIdMap.get(id)
    if (!slot) {
      throw new Error(`slot ${id} not found`)
    }
    return slot
  }

  function getItemById(id: string): Item {
    const item = itemIdMap.get(id)
    if (!item) {
      throw new Error(`item ${id} not found`)
    }
    return item
  }

  function getChestById(id: string): Chest {
    const chest = chestIdMap.get(id)
    if (!chest) {
      throw new Error(`chest ${id} not found`)
    }
    return chest
  }

  function getActionTargetById(id: string): ActionTarget {
    const action = actionTargetIdMap.get(id)
    if (!action) {
      throw new Error(`actionTarget ${id} not found`)
    }
    return action
  }

  return {
    load,
    allSkill,
    allSlot,
    allChest,
    getSkillById,
    getStateById,
    getSlotById,
    getItemById,
    getChestById,
    getActionTargetById,
    skillIdMap,
    stateIdMap,
  }
})
