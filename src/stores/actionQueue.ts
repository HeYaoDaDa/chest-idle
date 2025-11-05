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

  const currentActionStartTime = ref(undefined as undefined | number)
  const currentActionElapsed = ref(0)

  // ============ 计算属性 ============
  const currentAction = computed(() => actionQueue.value[0] || null)
  const queueingActions = computed(() => actionQueue.value.slice(1))
  const queueLength = computed(() => actionQueue.value.length)

  // 当前动作的显示信息
  const currentActionDisplay = computed(() => {
    if (!currentAction.value) return null
    return {
      amountDisplay: currentAction.value.amount === Infinity
        ? '∞'
        : currentAction.value.amount.toLocaleString(),
      remainedDuration: Math.max(0, currentAction.value.target.duration.value - currentActionElapsed.value),
      progress: currentAction.value.target.duration.value > 0
        ? currentActionElapsed.value / currentAction.value.target.duration.value
        : 0
    }
  })

  // ============ 基础功能 ============

  function addAction(target: ActionTarget, amount: number = Infinity) {
    const actionItem = createActionItem(target, amount)
    actionQueue.value.push(actionItem)

    // 如果没有当前执行的动作，立即开始执行
    if (actionQueue.value.length === 1) {
      startCurrentAction()
    }
  }

  function removeAction(index: number) {
    if (index < 0 || index >= actionQueue.value.length) return

    if (index === 0) {
      // 移除当前执行的动作
      stopCurrentAction()
    } else {
      // 移除队列中的动作
      actionQueue.value.splice(index, 1)
    }
  }

  function clearQueue() {
    if (currentAction.value) {
      // 保留当前执行的动作，清除其他所有
      actionQueue.value = [actionQueue.value[0]]
    } else {
      actionQueue.value = []
    }
  }

  function insertFront(target: ActionTarget, amount: number = Infinity) {
    const actionItem = createActionItem(target, amount)

    if (currentAction.value) {
      // 插入到队列第二位（当前动作之后）
      actionQueue.value.splice(1, 0, actionItem)
    } else {
      // 没有当前动作，直接添加并开始执行
      actionQueue.value.unshift(actionItem)
      startCurrentAction()
    }
  }

  function startImmediately(target: ActionTarget, amount: number = Infinity) {
    const actionItem = createActionItem(target, amount)

    if (currentAction.value) {
      // 中断当前动作，将其重新放入队列第二位
      const current = currentAction.value
      currentActionElapsed.value = 0 // 重置进度

      actionQueue.value.splice(1, 0, current)
      // 将新动作设为第一位
      actionQueue.value[0] = actionItem
      startCurrentAction()
    } else {
      // 没有当前动作，直接开始
      actionQueue.value.unshift(actionItem)
      startCurrentAction()
    }
  }

  // ============ 内部辅助函数 ============

  function startCurrentAction(): boolean {
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
      // 尝试下一个
      if (actionQueue.value.length > 0) {
        return startCurrentAction()
      }
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
      // 尝试下一个
      if (actionQueue.value.length > 0) {
        return startCurrentAction()
      }
      return false
    }

    // 更新动作信息并开始执行
    currentAction.value.amount = actualAmount
    currentActionStartTime.value = performance.now()
    currentActionElapsed.value = 0

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

  function stopCurrentAction() {
    if (currentAction.value) {
      actionQueue.value.shift()

      // 开始下一个动作
      if (actionQueue.value.length > 0) {
        startCurrentAction()
      }
    }
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
    if (!currentAction.value) return 0

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
      finishCurrentAction(count)

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
    target.skill.addXp(target.xp.value * count)

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

  function finishCurrentAction(count: number) {
    if (!currentAction.value) return

    if (currentAction.value.amount === Infinity) {
      // 无限次动作，重置时间继续执行
      currentActionElapsed.value = 0
    } else if (currentAction.value.amount === count) {
      // 动作完全完成，移除并开始下一个
      stopCurrentAction()
    } else if (currentAction.value.amount > count) {
      // 动作部分完成，减少数量并重置时间
      currentAction.value.amount -= count
      currentActionElapsed.value = 0
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

    // 如果移动的是当前执行的动作，需要开始下一个
    if (index === 0) {
      startCurrentAction()
    }
  }

  function restartCurrentAction() {
    if (currentAction.value) {
      currentActionElapsed.value = 0
      currentActionStartTime.value = undefined
      startCurrentAction()
    }
  }

  return {
    // 状态
    actionQueue,

    // 计算属性
    currentAction,
    queueingActions,
    queueLength,
    currentActionDisplay,

    // 方法
    addAction,
    removeAction,
    clearQueue,
    insertFront,
    startImmediately,
    start,

    // 排序方法
    moveUp,
    moveDown,
    moveTop,
    moveBottom,
  }
})
