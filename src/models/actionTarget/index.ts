import type { ActionTargetType } from '@/constants'
import type { Chest } from '../item/Chest'
import type { Skill } from '../Skill'
import { State } from '../state/State'
import type { Item } from '../item'
import type { MutableStateDefinition } from '../definitions/misc/MutableStateDefinition'
import { Effect } from '../state/Effect'
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
    skill: Skill,
    public tab: string | undefined,
    public minLevel: number,
    public sort: number,
    duration: MutableStateDefinition,
    xp: MutableStateDefinition,
    chest: Chest,
    chestPoints: MutableStateDefinition,
    ingredients: { item: Item; count: number }[],
    product: { item: Item; count: number }[],
    resolveState: (id: string) => State,
  ) {
    this.name = `actionTarget.${this.id}.name`
    this.description = `actionTarget.${this.id}.description`
    this.skill = skill
    this.duration = this.newState(duration, resolveState, minLevel, skill)
    this.xp = this.newState(xp, resolveState, minLevel, skill)
    this.chest = chest
    this.chestPoints = this.newState(chestPoints, resolveState, minLevel, skill)
    this.ingredients.push(...ingredients)
    this.products.push(...product)
  }
  private newState(
    definition: MutableStateDefinition,
    resolveState: (id: string) => State,
    minLevel: number,
    skill: Skill,
  ): State {
    const state = new State(definition.base)
    for (const boost of definition.boosts) {
      if (typeof boost === 'object') {
        const effect = resolveState(boost.state)
        state.addEffect(boost.state, new Effect(boost.type, effect._value))
      } else {
        switch (boost) {
          case 'overLevelSpeedUp':
            state.addEffect(
              'overLevelSpeedUp',
              new Effect(
                'inversePercentage',
                computed(() => Math.max(0, (skill.level - minLevel) * 0.01)),
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
