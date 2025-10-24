import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { Item } from '.'
import type { LootEntryDefinition } from '../definitions/misc/LootEntryDefinition'

export class Chest extends Item {
  type = 'chest' as const
  points: Ref<number> = ref(0)
  remainingPointsForNext: ComputedRef<number>
  pointProgress: ComputedRef<number>
  loots: {
    item: Item
    chance: number
    min: number
    max: number
  }[] = []

  constructor(
    id: string,
    sort: number,
    public maxPoints: number,
    public _loots: LootEntryDefinition[],
  ) {
    super(id, sort)
    this.remainingPointsForNext = computed(() => this.maxPoints - this.points.value)
    this.pointProgress = computed(() => this.points.value / this.maxPoints)
  }

  addPoint(point: number): number {
    const newPoints = this.points.value + point
    this.points.value = newPoints % this.maxPoints
    return Math.floor(newPoints / this.maxPoints)
  }
}
