import type { Chest } from '../item/Chest'
import { State } from '../state/State'
import type { Item } from '../item'
import type { MutableStateDefinition } from '../definitions/misc/MutableStateDefinition'
import { Effect } from '../state/Effect'

export class ActionTarget {
  name: string
  description: string
  skillId: string
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
    chest: Chest,
    chestPoints: MutableStateDefinition,
    ingredients: { item: Item; count: number }[],
    product: { item: Item; count: number }[],
    resolveState: (id: string) => State,
    getSkillLevel: () => number,
  ) {
    this.name = `actionTarget.${this.id}.name`
    this.description = `actionTarget.${this.id}.description`
    this.skillId = skillId
    this.duration = this.#newState(duration, resolveState, minLevel, getSkillLevel)
    this.xp = this.#newState(xp, resolveState, minLevel, getSkillLevel)
    this.chest = chest
    this.chestPoints = this.#newState(chestPoints, resolveState, minLevel, getSkillLevel)
    this.ingredients.push(...ingredients)
    this.products.push(...product)
  }
  #newState(
    definition: MutableStateDefinition,
    resolveState: (id: string) => State,
    minLevel: number,
    getSkillLevel: () => number,
  ): State {
    const state = new State(definition.base)
    for (const boost of definition.boosts) {
      if (typeof boost === 'object') {
        const effect = resolveState(boost.state)
        state.addEffect(boost.state, new Effect(boost.type, () => effect.getValue()))
      } else {
        switch (boost) {
          case 'overLevelSpeedUp':
            state.addEffect(
              'overLevelSpeedUp',
              new Effect(
                'inversePercentage',
                () => Math.max(0, (getSkillLevel() - minLevel) * 0.01),
              ),
            )
            break
        }
      }
    }
    return state
  }
}
