import { ActionTarget } from '.'
import type { MutableStateDefinition } from '../definitions/misc/MutableStateDefinition'
import type { Skill } from '../Skill'
import type { Chest } from '../item/Chest'
import type { Item } from '../item'
import type { State } from '../state/State'

export class Recipe extends ActionTarget {
  type = 'recipe' as const

  constructor(
    id: string,
    skill: Skill,
    tab: string | undefined,
    minLevel: number,
    sort: number,
    duration: MutableStateDefinition,
    xp: MutableStateDefinition,
    chest: Chest,
    chestPoints: MutableStateDefinition,
    ingredients: { item: Item; count: number }[],
    products: { item: Item; count: number }[],
    resolveState: (id: string) => State,
  ) {
    super(id, skill, tab, minLevel, sort, duration, xp, chest, chestPoints, ingredients, products, resolveState)
  }
}
