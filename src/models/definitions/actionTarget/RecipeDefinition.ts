import type { MutableStateDefinition } from "../misc/MutableStateDefinition"

export interface RecipeDefinition {
  type: "actionTarget"
  targetType: "recipe"
  id: string
  skill: string
  minLevel: number
  sort: number
  duration: MutableStateDefinition
  xp: MutableStateDefinition
  chest: string
  chestPoints: MutableStateDefinition
  ingredients: { item: string, count: number }[]
  products: { item: string, count: number }[]
}
