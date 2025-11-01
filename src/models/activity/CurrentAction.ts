import { type Ref, type ComputedRef, ref, computed, watchEffect } from 'vue'
import type { ActionTarget } from '../actionTarget'
import type { Skill } from '../Skill'
import type { Item } from '../item'
import type { State } from '../state/State'
import { usePlayerStore } from '@/stores/player'
import { actionManager } from '../global/ActionManager'
import i18n from '@/i18n'

export class CurrentAction {
  target: ActionTarget
  amount: Ref<number>
  amountDisplay: ComputedRef<string> = computed(() =>
    this.amount.value.toLocaleString(i18n.global.locale.value),
  )
  finalize: () => void

  skill: Skill
  startTime: number

  elapsed: Ref<number> = ref(0)

  duration: State
  xp: State
  chestPoints: State
  remainedDuration: ComputedRef<number>

  private playerStore = usePlayerStore()

  constructor(target: ActionTarget, amount: number) {
    this.target = target
    this.amount = ref(amount)
    this.skill = this.target.skill
    this.startTime = performance.now()
    this.duration = target.duration
    this.xp = target.xp
    this.chestPoints = target.chestPoints
    this.remainedDuration = computed(() => this.duration.value - this.elapsed.value)
    this.finalize = watchEffect(() => {
      let exhaust = Infinity
      if ('ingredients' in target) {
        const alls: number[] = []
        for (const ingredient of target.ingredients) {
          const inventoryItem = this.playerStore.inventoryMap.get(ingredient.item.id)
          if (inventoryItem) {
            alls.push(Math.floor(inventoryItem.quantity / ingredient.count))
          } else {
            alls.push(0)
          }
        }
        exhaust = Math.min(...alls, exhaust)
      }
      this.amount.value = Math.min(this.amount.value, exhaust)
    })
  }

  static computeAmount(target: ActionTarget, amount: number): number {
    const playerStore = usePlayerStore()
    let exhaust = Infinity
    if ('ingredients' in target) {
      const alls: number[] = []
      for (const ingredient of target.ingredients) {
        const inventoryItem = playerStore.inventoryMap.get(ingredient.item.id)
        if (inventoryItem) {
          alls.push(Math.floor(inventoryItem.quantity / ingredient.count))
        } else {
          alls.push(0)
        }
      }
      exhaust = Math.min(...alls, exhaust)
    }
    return Math.min(amount, exhaust)
  }

  public update(elapsed: number): number {
    if (elapsed < this.remainedDuration.value) {
      this.elapsed.value += elapsed
      return 0
    } else {
      let count = this.amount.value
      count = Math.min(
        count,
        1 + Math.floor((elapsed - this.remainedDuration.value) / this.duration.value),
      )
      count = Math.min(count, Math.ceil(this.skill.remainingXpForUpgrade.value / this.xp.value))

      const ingredient = this.calculateIngredient(count)
      if (ingredient) {
        this.playerStore.removeManyItems(ingredient)
      }

      this.skill.addXp(this.xp.value * count)
      const chestCount = this.target.chest.addPoint(this.chestPoints.value * count)
      const rewards = this.calculateRewards(count)
      if (chestCount > 0) {
        rewards.push([this.target.chest, chestCount])
      }
      this.playerStore.addManyItems(rewards)

      const remainedElapsed =
        elapsed - (this.remainedDuration.value + this.duration.value * (count - 1))

      this.elapsed.value = 0
      actionManager.finishCurrentAction(count)

      return remainedElapsed
    }
  }

  calculateIngredient(count: number): [string, number][] | undefined {
    const result = [] as [string, number][]
    const loots = this.target.ingredients
    for (const loot of loots) {
      result.push([loot.item.id, loot.count * count])
    }
    return result.length > 0 ? result : undefined
  }

  calculateRewards(count: number): [Item, number][] {
    const result = [] as [Item, number][]
    for (const loot of this.target.products) {
      result.push([loot.item, loot.count * count])
    }
    return result
  }
}
