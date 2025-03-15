import { defineStore } from 'pinia'
import { computed, ref, shallowReactive } from 'vue'
import { useInventoryStore } from './inventory'
import type { Amount } from '@/model/common/Amount'
import type { Item } from '@/model/data/Item'
import MersenneTwister from 'mersenne-twister'
import { type AreaInterface } from '@/global'

export const useActionStore = defineStore('action', () => {
  const inventoryStore = useInventoryStore()

  const actionQueue = shallowReactive([] as ActionQueueItem[])
  const runningAction = ref(undefined as RunningAction | undefined)

  const isRunning = computed(() => actionQueue.length > 0)
  const queuedActions = computed(() => (actionQueue.length > 1 ? actionQueue.slice(1) : []))

  function startAction() {
    if (isRunning.value && !runningAction.value) {
      const duration = actionQueue[0].calculateDuration()
      runningAction.value = new RunningAction(
        actionQueue[0],
        performance.now(),
        duration,
        setTimeout(completeAction, duration),
      )
    } else {
      console.error(
        `Start action but isRunning is ${isRunning.value}, have runningAction is ${runningAction.value !== undefined}`,
      )
    }
  }

  function completeAction() {
    if (runningAction.value) {
      const prevAction = runningAction.value
      runningAction.value = undefined

      inventoryStore.adds(prevAction.calculateRewards())
      prevAction.action.area.skill.addXp(prevAction.action.area.xp)

      const amount = prevAction.action.amount
      if (amount.isInfinite) {
        startAction()
      } else {
        if (amount.amount > 1) {
          amount.amount -= 1
          startAction()
        } else {
          removeAction(0)
        }
      }
    } else {
      console.error('Complete action not exist')
    }
  }

  function addAction(area: AreaInterface, amount: Amount) {
    actionQueue.push(new ActionQueueItem(area, amount))
    if (actionQueue.length === 1) {
      startAction()
    }
  }

  function removeAction(index: number) {
    if (actionQueue.length > index) {
      if (index === 0) {
        actionQueue.splice(index, 1)
        if (runningAction.value) {
          runningAction.value.cancel()
          runningAction.value = undefined
        }
        if (isRunning.value) {
          startAction()
        }
      } else {
        actionQueue.splice(index, 1)
      }
    } else {
      console.error(`ActionQueue index ${index} not exist`)
    }
  }

  return {
    actionQueue,
    runningAction,

    isRunning,
    queuedActions,

    addAction,
    removeAction,
  }
})

class ActionQueueItem {
  constructor(
    public area: AreaInterface,
    public amount: Amount,
  ) { }

  calculateDuration(): number {
    const skill = this.area.skill
    if (skill) {
      return Math.max(this.area.baseTime * (1 - 0.009 * skill.level.value), 1000)
    }
    return this.area.baseTime
  }

  toShow(): string {
    return `${this.area.skill.name} | ${this.area.name} [${this.amount}]`
  }
}

class RunningAction {
  constructor(
    public action: ActionQueueItem,
    public startTime: number,
    public duration: number,
    public timeoutId: number,
  ) { }

  cancel() {
    clearTimeout(this.timeoutId)
  }

  calculateRewards(): [Item, number][] {
    const products = this.action.area.products
    const result = [] as [Item, number][]
    for (const product of products) {
      const rng = new MersenneTwister()
      if (product.percentage >= rng.random_incl() * 100) {
        result.push([
          product.item,
          Math.floor(product.min + rng.random_incl() * (product.max - product.min + 1)),
        ])
      }
    }
    return result
  }
}
