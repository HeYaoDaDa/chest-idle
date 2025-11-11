import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Item } from '@/models/item'
import { usePlayerStore } from './player'
import { useNotificationStore } from './notification'
import i18n from '@/i18n'
import { useSkillStore } from './skill'
import { useActionQueueStore } from './actionQueue'
import type { Action } from '@/models/Action'

export const useActionRunnerStore = defineStore('actionRunner', () => {
  const skillStore = useSkillStore()
  const actionQueueStore = useActionQueueStore()
  const progress = ref(0)

  // ============ 基础的游戏循环 ============
  function start() {
    requestAnimationFrame(update)
  }

  function update() {
    if (actionQueueStore.actionStartDate) {
      const now = performance.now()
      let remainedElapsed = now - actionQueueStore.actionStartDate
      while (actionQueueStore.currentAction && remainedElapsed > 0) {
        remainedElapsed = updateCurrentAction(remainedElapsed)
      }
    }
    // 更新进度条
    if (actionQueueStore.actionStartDate && actionQueueStore.currentAction1) {
      const elapsed = performance.now() - actionQueueStore.actionStartDate;
      progress.value = Math.min(actionQueueStore.currentAction1.getDuration() > 0
        ? elapsed / actionQueueStore.currentAction1.getDuration()
        : 0, 1) * 100
    } else {
      progress.value = 0
    }
    requestAnimationFrame(update)
  }

  function updateCurrentAction(elapsed: number): number {
    if (!actionQueueStore.actionStartDate || !actionQueueStore.currentAction1) return 0
    if (!checkCurrentActionItem()) return elapsed

    const amount = actionQueueStore.currentAction.amount
    const action = actionQueueStore.currentAction1
    const skill = skillStore.getSkill(action.skillId)

    if (elapsed < action.getDuration()) {
      // 动作还未完成
      return 0
    } else {
      // 动作完成，计算完成次数
      let count = amount
      count = Math.min(
        count,
        Math.floor(elapsed / action.getDuration())
      )
      if (skill) {
        count = Math.min(count, Math.ceil(skill.remainingXpForUpgrade / action.getXp()))
      }

      // 执行动作效果
      executeAction(action, count)

      const computedElapsedTime = action.getDuration() * count

      // 计算剩余时间
      const remainedElapsed = elapsed - computedElapsedTime

      actionQueueStore.completeCurrentAction(computedElapsedTime, count)

      return remainedElapsed
    }
  }

  function executeAction(action: Action, count: number) {
    const playerStore = usePlayerStore()

    // 消耗材料
    if (action.ingredients) {
      const ingredients: [string, number][] = []
      for (const ingredient of action.ingredients) {
        ingredients.push([ingredient.item.id, ingredient.count * count])
      }
      playerStore.removeManyItems(ingredients)
    }

    // 增加经验
    skillStore.addSkillXp(action.skillId, action.getXp() * count)

    // 增加箱子点数并获得箱子
    const chestCount = playerStore.addChestPoints(action.chest.id, action.getChestPoints() * count)

    // 计算奖励
    const rewards: [unknown, number][] = []
    for (const product of action.products) {
      rewards.push([product.item, product.count * count])
    }

    // 添加箱子奖励
    if (chestCount > 0) {
      rewards.push([action.chest, chestCount])
    }

    // 给予奖励
    if (rewards.length > 0) {
      playerStore.addManyItems(rewards as [Item, number][])
    }
  }

  // ============ 内部辅助函数 ============

  function checkCurrentActionItem(): boolean {
    if (!actionQueueStore.currentAction || !actionQueueStore.currentAction1) return false

    const action = actionQueueStore.currentAction1
    const amount = actionQueueStore.currentAction.amount

    // 检查等级要求
    const currentLevel = skillStore.getSkillLevel(action.skillId)
    if (currentLevel < action.minLevel) {
      console.warn(
        `Required level ${action.minLevel} for action ${action.id}, but current level is ${currentLevel}`
      )
      const notificationStore = useNotificationStore()
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
      const notificationStore = useNotificationStore()
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
    const playerStore = usePlayerStore()
    let maxAmount = Infinity

    if (action.ingredients) {
      for (const ingredient of action.ingredients) {
        const inventoryItem = playerStore.inventoryMap.get(ingredient.item.id)
        const availableCount = inventoryItem ? inventoryItem.quantity : 0
        const maxForThisIngredient = Math.floor(availableCount / ingredient.count)
        maxAmount = Math.min(maxAmount, maxForThisIngredient)
      }
    }

    return Math.min(amount, maxAmount)
  }

  return {
    progress,
    start,
  }
})
