import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ActionTarget } from '@/models/actionTarget'
import type { ActionItem } from '@/models/activity/ActionItem'
import { createActionItem } from '@/models/activity/ActionItem'
import type { Item } from '@/models/item'
import { usePlayerStore } from './player'
import { useNotificationStore } from './notification'
import i18n from '@/i18n'

export const useActionQueueStore = defineStore('actionQueue', () => {
  // ============ 核心状态 ============
  const actionQueue = ref<ActionItem[]>([])
  const lastUpdateDate = ref(performance.now())

  const currentActionElapsed = ref(0)

  // ============ 计算属性 ============
  const currentAction = computed(() => actionQueue.value[0] || null)
  const queueingActions = computed(() => actionQueue.value.slice(1))
  const queueLength = computed(() => actionQueue.value.length)

  const progress = computed(() => {
    if (currentAction.value) {
      return Math.min(currentAction.value.target.duration.value > 0
        ? currentActionElapsed.value / currentAction.value.target.duration.value
        : 0, 1) * 100
    }
    return 0
  })

  // ============ 基础功能 ============

  function startImmediately(target: ActionTarget, amount: number = Infinity) {
    const actionItem = createActionItem(target, amount)
    actionQueue.value.unshift(actionItem)
    currentActionElapsed.value = 0
  }

  function addAction(target: ActionTarget, amount: number = Infinity) {
    const actionItem = createActionItem(target, amount)
    actionQueue.value.push(actionItem)
    currentActionElapsed.value = 0
  }

  function removeAction(index: number) {
    if (index < 0 || index >= actionQueue.value.length) return

    actionQueue.value.splice(index, 1)
    if (index === 0) {
      currentActionElapsed.value = 0
    }
  }

  // ============ 内部辅助函数 ============

  function checkCurrentActionItem(): boolean {
    if (!currentAction.value) return false

    const target = currentAction.value.target
    const amount = currentAction.value.amount

    // 检查等级要求
    if (target.skill.level < target.minLevel) {
      console.warn(
        `Required level ${target.minLevel} for action ${target.id}, but current level is ${target.skill.level}`
      )
      const notificationStore = useNotificationStore()
      notificationStore.warning('notification.levelTooLow', {
        skill: i18n.global.t(target.skill.name),
        level: target.skill.level,
        required: target.minLevel,
        action: i18n.global.t(target.name),
      })
      // 移除无法执行的动作
      actionQueue.value.shift()
      return false
    }

    // 检查材料是否足够
    const actualAmount = computeAmount(target, amount)
    if (actualAmount <= 0) {
      const notificationStore = useNotificationStore()
      notificationStore.warning('notification.notEnoughMaterials', {
        action: i18n.global.t(target.name),
      })
      // 移除无法执行的动作
      actionQueue.value.shift()
      return false
    }
    currentAction.value.amount = actualAmount

    return true
  }

  function computeAmount(target: ActionItem['target'], amount: number): number {
    const playerStore = usePlayerStore()
    let maxAmount = Infinity

    if (target.ingredients) {
      for (const ingredient of target.ingredients) {
        const inventoryItem = playerStore.inventoryMap.get(ingredient.item.id)
        const availableCount = inventoryItem ? inventoryItem.quantity : 0
        const maxForThisIngredient = Math.floor(availableCount / ingredient.count)
        maxAmount = Math.min(maxAmount, maxForThisIngredient)
      }
    }

    return Math.min(amount, maxAmount)
  }

  // ============ 基础的游戏循环 ============

  function start() {
    requestAnimationFrame(update)
  }

  function update() {
    const now = performance.now()
    const elapsed = (now - lastUpdateDate.value) * 100 // 转换为毫秒并加速
    lastUpdateDate.value = now

    let remainedElapsed = elapsed
    while (currentAction.value && remainedElapsed > 0) {
      remainedElapsed = updateCurrentAction(remainedElapsed)
    }

    requestAnimationFrame(update)
  }

  function updateCurrentAction(elapsed: number): number {
    if (!checkCurrentActionItem()) return elapsed

    const action = currentAction.value
    const target = action.target
    const remainedDuration = target.duration.value - currentActionElapsed.value

    if (elapsed < remainedDuration) {
      // 动作还未完成
      currentActionElapsed.value += elapsed
      return 0
    } else {
      // 动作完成，计算完成次数
      let count = action.amount
      count = Math.min(
        count,
        1 + Math.floor((elapsed - remainedDuration) / target.duration.value)
      )
      count = Math.min(count, Math.ceil(target.skill.remainingXpForUpgrade / target.xp.value))

      // 执行动作效果
      executeAction(action, count)

      // 计算剩余时间
      const remainedElapsed = elapsed - (remainedDuration + target.duration.value * (count - 1))

      // 重置或移除动作
      currentActionElapsed.value = 0
      if (currentAction.value.amount === Infinity) {
        // 无限次动作，继续执行
      } else if (currentAction.value.amount === count) {
        actionQueue.value.shift()
        currentActionElapsed.value = 0
      } else if (currentAction.value.amount > count) {
        // 动作部分完成，减少数量并重置时间
        currentAction.value.amount -= count
      }

      return remainedElapsed
    }
  }

  function executeAction(action: ActionItem, count: number) {
    const playerStore = usePlayerStore()
    const target = action.target

    // 消耗材料
    if (target.ingredients) {
      const ingredients: [string, number][] = []
      for (const ingredient of target.ingredients) {
        ingredients.push([ingredient.item.id, ingredient.count * count])
      }
      playerStore.removeManyItems(ingredients)
    }

    // 增加经验
    playerStore.addSkillXp(target.skill.id, target.xp.value * count)

    // 增加箱子点数并获得箱子
    const chestCount = playerStore.addChestPoints(target.chest.id, target.chestPoints.value * count)

    // 计算奖励
    const rewards: [unknown, number][] = []
    for (const product of target.products) {
      rewards.push([product.item, product.count * count])
    }

    // 添加箱子奖励
    if (chestCount > 0) {
      rewards.push([target.chest, chestCount])
    }

    // 给予奖励
    if (rewards.length > 0) {
      playerStore.addManyItems(rewards as [Item, number][])
    }
  }

  // ============ 队列排序功能 ============

  function moveUp(index: number): void {
    if (index <= 0 || index >= actionQueue.value.length) return

    // 交换当前位置和上一个位置
    const temp = actionQueue.value[index]
    actionQueue.value[index] = actionQueue.value[index - 1]
    actionQueue.value[index - 1] = temp

    // 如果涉及到当前执行的动作（index 0 和 1），需要重新开始
    if (index === 1) {
      restartCurrentAction()
    }
  }

  function moveDown(index: number): void {
    if (index < 0 || index >= actionQueue.value.length - 1) return

    // 交换当前位置和下一个位置
    const temp = actionQueue.value[index]
    actionQueue.value[index] = actionQueue.value[index + 1]
    actionQueue.value[index + 1] = temp

    // 如果涉及到当前执行的动作（index 0），需要重新开始
    if (index === 0) {
      restartCurrentAction()
    }
  }

  function moveTop(index: number): void {
    if (index <= 0 || index >= actionQueue.value.length) return

    // 移动到队列顶部
    const item = actionQueue.value.splice(index, 1)[0]
    actionQueue.value.unshift(item)

    // 重新开始当前动作
    restartCurrentAction()
  }

  function moveBottom(index: number): void {
    if (index < 0 || index >= actionQueue.value.length) return

    // 移动到队列底部
    const item = actionQueue.value.splice(index, 1)[0]
    actionQueue.value.push(item)
  }

  function restartCurrentAction() {
    if (currentAction.value) {
      currentActionElapsed.value = 0
    }
  }

  return {
    // 状态
    actionQueue,

    // 计算属性
    currentAction,
    queueingActions,
    queueLength,
    progress,

    // 方法
    addAction,
    removeAction,
    startImmediately,
    start,

    // 排序方法
    moveUp,
    moveDown,
    moveTop,
    moveBottom,
  }
})
