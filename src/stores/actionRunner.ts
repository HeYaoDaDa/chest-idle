import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Item } from '@/models/item'
import { usePlayerStore } from './player'
import { useNotificationStore } from './notification'
import i18n from '@/i18n'
import { useSkillStore } from './skill'
import { useActionQueueStore } from './actionQueue'

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
    if (actionQueueStore.actionStartDate) {
      const elapsed = performance.now() - actionQueueStore.actionStartDate;
      progress.value = Math.min(actionQueueStore.currentAction.target.getDuration() > 0
        ? elapsed / actionQueueStore.currentAction.target.getDuration()
        : 0, 1) * 100
    } else {
      progress.value = 0
    }
    requestAnimationFrame(update)
  }

  function updateCurrentAction(elapsed: number): number {
    if (!actionQueueStore.actionStartDate) return 0
    if (!checkCurrentActionItem()) return elapsed

    const action = actionQueueStore.currentAction
    const target = action.target
    const skill = skillStore.getSkill(target.skillId)

    if (elapsed < target.getDuration()) {
      // 动作还未完成
      return 0
    } else {
      // 动作完成，计算完成次数
      let count = action.amount
      count = Math.min(
        count,
        Math.floor(elapsed / target.getDuration())
      )
      if (skill) {
        count = Math.min(count, Math.ceil(skill.remainingXpForUpgrade / target.getXp()))
      }

      // 执行动作效果
      executeAction(action, count)

      const computedElapsedTime = target.getDuration() * count

      // 计算剩余时间
      const remainedElapsed = elapsed - computedElapsedTime

      actionQueueStore.completeCurrentAction(computedElapsedTime, count)

      return remainedElapsed
    }
  }

  function executeAction(action: typeof actionQueueStore.currentAction extends infer T ? T : never, count: number) {
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
    skillStore.addSkillXp(target.skillId, target.getXp() * count)

    // 增加箱子点数并获得箱子
    const chestCount = playerStore.addChestPoints(target.chest.id, target.getChestPoints() * count)

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

  // ============ 内部辅助函数 ============

  function checkCurrentActionItem(): boolean {
    if (!actionQueueStore.currentAction) return false

    const target = actionQueueStore.currentAction.target
    const amount = actionQueueStore.currentAction.amount

    // 检查等级要求
    const currentLevel = skillStore.getSkillLevel(target.skillId)
    if (currentLevel < target.minLevel) {
      console.warn(
        `Required level ${target.minLevel} for action ${target.id}, but current level is ${currentLevel}`
      )
      const notificationStore = useNotificationStore()
      const skillConfig = skillStore.getSkill(target.skillId)
      notificationStore.warning('notification.levelTooLow', {
        skill: skillConfig ? i18n.global.t(skillConfig.name) : target.skillId,
        level: currentLevel,
        required: target.minLevel,
        action: i18n.global.t(target.name),
      })
      // 移除无法执行的动作
      actionQueueStore.removeAction(0)
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
      actionQueueStore.removeAction(0)
      return false
    }
    actionQueueStore.currentAction.amount = actualAmount

    return true
  }

  function computeAmount(target: typeof actionQueueStore.currentAction extends { target: infer T } ? T : never, amount: number): number {
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

  return {
    progress,
    start,
  }
})
