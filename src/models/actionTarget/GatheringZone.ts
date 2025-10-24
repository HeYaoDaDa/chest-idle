import { ActionTarget } from '.'
import type { MutableStateDefinition } from '../definitions/misc/MutableStateDefinition'

export class GatheringZone extends ActionTarget {
  type = 'gatheringZone' as const

  constructor(
    public id: string,
    skillId: string,
    public minLevel: number,
    public sort: number,
    duration: MutableStateDefinition,
    xp: MutableStateDefinition,
    chestId: string,
    chestPoints: MutableStateDefinition,
    products: { item: string; count: number }[],
  ) {
    super(id, skillId, minLevel, sort, duration, xp, chestId, chestPoints, [], products)
  }
}
