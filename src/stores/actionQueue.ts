import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { isInfiniteAmount, decrementAmount } from '@/utils/amount'
import { INFINITE_AMOUNT } from '@/utils/constants'

import { useActionStore } from './action'

export const useActionQueueStore = defineStore('actionQueue', () => {
  const actionStore = useActionStore()

  const actionQueue = ref<
    {
      actionId: string
      amount: number
    }[]
  >([])
  const actionStartDate = ref<number | null>(null)
  const progress = ref<number>(0)

  const currentAction = computed(() => actionQueue.value[0] || null)
  const pendingActions = computed(() => actionQueue.value.slice(1))
  const queueLength = computed(() => actionQueue.value.length)

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

  function moveUp(index: number): void {
    if (index <= 0 || index >= actionQueue.value.length) return

    const temp = actionQueue.value[index]
    actionQueue.value[index] = actionQueue.value[index - 1]
    actionQueue.value[index - 1] = temp

    if (index === 1) {
      actionStartDate.value = performance.now()
    }
  }

  function moveDown(index: number): void {
    if (index < 0 || index >= actionQueue.value.length - 1) return

    const temp = actionQueue.value[index]
    actionQueue.value[index] = actionQueue.value[index + 1]
    actionQueue.value[index + 1] = temp

    if (index === 0) {
      actionStartDate.value = performance.now()
    }
  }

  function moveTop(index: number): void {
    if (index <= 0 || index >= actionQueue.value.length) return

    const item = actionQueue.value.splice(index, 1)[0]
    actionQueue.value.unshift(item)

    actionStartDate.value = performance.now()
  }

  function moveBottom(index: number): void {
    if (index < 0 || index >= actionQueue.value.length) return

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

    if (isInfiniteAmount(actionItem.amount)) {
      actionStartDate.value += elapsed
      return
    }
    if (actionItem.amount > executionCount) {
      actionStartDate.value += elapsed

      actionItem.amount = decrementAmount(actionItem.amount, executionCount)
    } else {
      actionQueue.value.shift()
      if (currentAction.value) {
        actionStartDate.value += elapsed
      } else {
        actionStartDate.value = null
      }
    }
  }

  return {
    actionQueue,
    actionStartDate,
    progress,

    currentAction,
    pendingActions,
    queueLength,

    actionQueueDetails,
    currentActionDetail,

    addAction,
    removeAction,
    startImmediately,
    completeCurrentAction,

    moveUp,
    moveDown,
    moveTop,
    moveBottom,
  }
})
