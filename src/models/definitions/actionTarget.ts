export interface ActionTargetDefinition {
  type: 'actionTarget'
  id: string
  skill: string
  tab?: string
  minLevel: number
  sort: number
  duration: number
  xp: number
  chest: string
  chestPoints: number
  ingredients?: { item: string; count: number }[]
  products: { item: string; count: number }[]
}
