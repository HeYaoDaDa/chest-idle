import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { isInfiniteAmount, decrementAmount } from '@/utils/amount'
import { INFINITE_AMOUNT } from '@/utils/constants'

import { useActionStore } from './action'

export const useActionQueueStore = defineStore('actionQueue', () => {
  const actionStore = useActionStore()

  // ============ 核心状态 ============
  const actionQueue = ref<
    {
      actionId: string
      amount: number
    }[]
  >([])
  const actionStartDate = ref<number | null>(null)
  const progress = ref<number>(0)

  // ============ 计算属性 ============
  const currentAction = computed(() => actionQueue.value[0] || null)
  const pendingActions = computed(() => actionQueue.value.slice(1))
  const queueLength = computed(() => actionQueue.value.length)

  // 获取包含完整 Action 详情的队列和当前动作
  const actionQueueDetails = computed(() =>
    actionQueue.value.map((actionItem) => {
      return actionStore.getActionById(actionItem.actionId)
    }),
  )
  const currentActionDetail = computed(() => {
    const actionItem = actionQueue.value[0]
    if (!actionItem) return null
    return actionStore.getActionById(actionItem.actionId)
  })

  // ============ 基础功能 ============

  function startImmediately(actionId: string, amount: number = INFINITE_AMOUNT): void {
    actionQueue.value.unshift({ actionId, amount })
    actionStartDate.value = performance.now()
  }

  function addAction(actionId: string, amount: number = INFINITE_AMOUNT): void {
    actionQueue.value.push({ actionId, amount })
    if (actionQueue.value.length === 1) {
      actionStartDate.value = performance.now()
    }
  }

  function removeAction(index: number): void {
    if (index < 0 || index >= actionQueue.value.length) return

    actionQueue.value.splice(index, 1)
    if (index === 0) {
      if (actionQueue.value.length > 0) {
        actionStartDate.value = performance.now()
      } else {
        actionStartDate.value = null
      }
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
      actionStartDate.value = performance.now()
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
      actionStartDate.value = performance.now()
    }
  }

  function moveTop(index: number): void {
    if (index <= 0 || index >= actionQueue.value.length) return

    // 移动到队列顶部
    const item = actionQueue.value.splice(index, 1)[0]
    actionQueue.value.unshift(item)

    // 重新开始当前动作
    actionStartDate.value = performance.now()
  }

  function moveBottom(index: number): void {
    if (index < 0 || index >= actionQueue.value.length) return

    // 移动到队列底部
    const item = actionQueue.value.splice(index, 1)[0]
    actionQueue.value.push(item)
    if (index === 0) {
      actionStartDate.value = performance.now()
    }
  }

  function completeCurrentAction(elapsed: number, executionCount: number): void {
    if (!actionStartDate.value) return
    if (!currentAction.value) return
    const actionItem = currentAction.value

    // 若该条目标记为无限，则不应减少数量或移除，直接推进开始时间
    if (isInfiniteAmount(actionItem.amount)) {
      actionStartDate.value += elapsed
      return
    }
    if (actionItem.amount > executionCount) {
      actionStartDate.value += elapsed
      // 动作部分完成，减少数量并重置时间
      actionItem.amount = decrementAmount(actionItem.amount, executionCount)
    } else {
      // 动作完全完成，移除动作并重置时间
      actionQueue.value.shift()
      if (currentAction.value) {
        actionStartDate.value += elapsed
      } else {
        actionStartDate.value = null
      }
    }
  }

  return {
    // 状态
    actionQueue,
    actionStartDate,
    progress,

    // 计算属性
    currentAction,
    pendingActions,
    queueLength,

    actionQueueDetails,
    currentActionDetail,

    // 方法
    addAction,
    removeAction,
    startImmediately,
    completeCurrentAction,

    // 排序方法
    moveUp,
    moveDown,
    moveTop,
    moveBottom,
  }
})
