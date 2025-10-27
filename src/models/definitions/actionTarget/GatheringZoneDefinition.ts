import type { MutableStateDefinition } from '../misc/MutableStateDefinition'

export interface GatheringZoneDefinition {
  type: 'actionTarget'
  targetType: 'gatheringZone'
  id: string
  skill: string
  tab?: string
  minLevel: number
  sort: number
  duration: MutableStateDefinition
  xp: MutableStateDefinition
  chest: string
  chestPoints: MutableStateDefinition
  products: { item: string; count: number }[]
}
