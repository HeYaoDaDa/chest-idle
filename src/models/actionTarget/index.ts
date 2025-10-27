import type { ActionTargetType } from '@/constants'
import type { Chest } from '../item/Chest'
import type { Skill } from '../Skill'
import { State } from '../state/State'
import type { Item } from '../item'
import type { MutableStateDefinition } from '../definitions/misc/MutableStateDefinition'
import { Effect } from '../state/Effect'
import { dataManager } from '../global/DataManager'
import type { GatheringZone } from './GatheringZone'
import type { Recipe } from './Recipe'
import { computed } from 'vue'

export abstract class ActionTarget {
  abstract type: ActionTargetType
  name: string
  description: string
  skill: Skill
  duration: State
  xp: State
  chest: Chest
  chestPoints: State
  ingredients: { item: Item; count: number }[] = []
  products: { item: Item; count: number }[] = []

  constructor(
    public id: string,
    skillId: string,
    public tab: string | undefined,
    public minLevel: number,
    public sort: number,
    duration: MutableStateDefinition,
    xp: MutableStateDefinition,
    chestId: string,
    chestPoints: MutableStateDefinition,
    ingredients: { item: string; count: number }[],
    product: { item: string; count: number }[],
  ) {
    this.name = `actionTarget.${this.id}.name`
    this.description = `actionTarget.${this.id}.description`
    this.skill = dataManager.getSkillById(skillId)
    this.duration = this.newState(duration)
    this.xp = this.newState(xp)
    this.chest = dataManager.getChestById(chestId)
    this.chestPoints = this.newState(chestPoints)
    for (const { item: itemId, count } of ingredients) {
      const item = dataManager.getItemById(itemId)
      this.ingredients.push({ item, count })
    }
    for (const { item: itemId, count } of product) {
      const item = dataManager.getItemById(itemId)
      this.products.push({ item, count })
    }
  }
  private newState(definition: MutableStateDefinition): State {
    const state = new State(definition.base)
    for (const boost of definition.boosts) {
      if (typeof boost === 'object') {
        const effect = dataManager.getStateById(boost.state)
        state.addEffect(boost.state, new Effect(boost.type, effect._value))
      } else {
        switch (boost) {
          case 'overLevelSpeedUp':
            state.addEffect(
              'overLevelSpeedUp',
              new Effect(
                'inversePercentage',
                computed(() => Math.max(0, (this.skill.level.value - this.minLevel) * 0.01)),
              ),
            )
            break
        }
      }
    }
    return state
  }

  isGatheringZone(): this is GatheringZone {
    return this.type === 'gatheringZone'
  }

  isRecipe(): this is Recipe {
    return this.type === 'recipe'
  }
}
