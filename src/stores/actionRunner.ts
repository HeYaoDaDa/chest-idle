import { defineStore } from 'pinia'

import i18n from '@/i18n'

import { useActionQueueStore } from './actionQueue'
import { useChestPointStore } from './chestPoint'
import { useInventoryStore } from './inventory'
import { useNotificationStore } from './notification'
import { useSkillStore } from './skill'

import type { Action } from './action'

export const useActionRunnerStore = defineStore('actionRunner', () => {
  const skillStore = useSkillStore()
  const inventoryStore = useInventoryStore()
  const actionQueueStore = useActionQueueStore()
  const notificationStore = useNotificationStore()
  const chestPointStore = useChestPointStore()

  // ============ 基础的游戏循环 ============
  function start(): void {
    requestAnimationFrame(update)
  }

  function update(): void {
    if (actionQueueStore.actionStartDate) {
      const now = performance.now()
      let remainedElapsed = now - actionQueueStore.actionStartDate
      while (actionQueueStore.currentAction && remainedElapsed > 0) {
        remainedElapsed = updateCurrentAction(remainedElapsed)
      }
    }
    // 更新进度条
    if (actionQueueStore.actionStartDate && actionQueueStore.currentActionDetail) {
      const elapsed = performance.now() - actionQueueStore.actionStartDate
      actionQueueStore.progress =
        Math.min(
          actionQueueStore.currentActionDetail.duration > 0
            ? elapsed / actionQueueStore.currentActionDetail.duration
            : 0,
          1,
        ) * 100
    } else {
      actionQueueStore.progress = 0
    }
    requestAnimationFrame(update)
  }

  function updateCurrentAction(elapsed: number): number {
    if (!actionQueueStore.actionStartDate || !actionQueueStore.currentActionDetail) return 0
    if (!checkCurrentActionItem()) return elapsed

    const amount = actionQueueStore.currentAction.amount
    const action = actionQueueStore.currentActionDetail
    const skill = skillStore.getSkill(action.skillId)

    if (elapsed < action.duration) {
      // 动作还未完成
      return 0
    } else {
      // 动作完成，计算完成次数
      let count = amount
      count = Math.min(count, Math.floor(elapsed / action.duration))
      if (skill) {
        count = Math.min(count, Math.ceil(skill.remainingXpForUpgrade / action.xp))
      }

      // 执行动作效果
      executeAction(action, count)

      const computedElapsedTime = action.duration * count

      // 计算剩余时间
      const remainedElapsed = elapsed - computedElapsedTime

      actionQueueStore.completeCurrentAction(computedElapsedTime, count)

      return remainedElapsed
    }
  }

  function executeAction(action: Action, count: number): void {
    // 消耗材料
    if (action.ingredients) {
      const ingredients: [string, number][] = []
      for (const ingredient of action.ingredients) {
        ingredients.push([ingredient.itemId, ingredient.count * count])
      }
      inventoryStore.removeManyItems(ingredients)
    }

    // 增加经验
    skillStore.addSkillXp(action.skillId, action.xp * count)

    // 增加箱子点数并获得箱子
    const chestCount = chestPointStore.addChestPoints(action.chestId, action.chestPoints * count)

    // 计算奖励
    const rewards: [string, number][] = []
    for (const product of action.products) {
      rewards.push([product.itemId, product.count * count])
    }

    // 添加箱子奖励
    if (chestCount > 0) {
      rewards.push([action.chestId, chestCount])
    }

    // 给予奖励
    if (rewards.length > 0) {
      inventoryStore.addManyItems(rewards)
    }
  }

  // ============ 内部辅助函数 ============

  function checkCurrentActionItem(): boolean {
    if (!actionQueueStore.currentAction || !actionQueueStore.currentActionDetail) return false

    const action = actionQueueStore.currentActionDetail
    const amount = actionQueueStore.currentAction.amount

    // 检查等级要求
    const currentLevel = skillStore.getSkillLevel(action.skillId)
    if (currentLevel < action.minLevel) {
      console.warn(
        `Required level ${action.minLevel} for action ${action.id}, but current level is ${currentLevel}`,
      )
      const skillConfig = skillStore.getSkill(action.skillId)
      notificationStore.warning('notification.levelTooLow', {
        skill: skillConfig ? i18n.global.t(skillConfig.name) : action.skillId,
        level: currentLevel,
        required: action.minLevel,
        action: i18n.global.t(action.name),
      })
      // 移除无法执行的动作
      actionQueueStore.removeAction(0)
      return false
    }

    // 检查材料是否足够
    const actualAmount = computeAmount(action, amount)
    if (actualAmount <= 0) {
      notificationStore.warning('notification.notEnoughMaterials', {
        action: i18n.global.t(action.name),
      })
      // 移除无法执行的动作
      actionQueueStore.removeAction(0)
      return false
    }
    actionQueueStore.currentAction.amount = actualAmount

    return true
  }

  function computeAmount(action: Action, amount: number): number {
    let maxAmount = Infinity

    if (action.ingredients) {
      for (const ingredient of action.ingredients) {
        const inventoryItemCount = inventoryStore.inventoryMap[ingredient.itemId]
        const availableCount = inventoryItemCount ? inventoryItemCount : 0
        const maxForThisIngredient = Math.floor(availableCount / ingredient.count)
        maxAmount = Math.min(maxAmount, maxForThisIngredient)
      }
    }

    return Math.min(amount, maxAmount)
  }

  return {
    start,
  }
})
