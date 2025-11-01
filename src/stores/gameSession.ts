import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useActionQueueStore } from './actionQueue'
import type { ActionTarget } from '@/models/actionTarget'

export const useGameSessionStore = defineStore('gameSession', () => {
  // Current game session state
  const isSessionActive = ref(false)
  const sessionStartTime = ref<number | null>(null)
  const actionQueueStore = useActionQueueStore()

  // Session management
  function initializeSession() {
    // Initialize a new game session
    actionQueueStore.clearQueue()
    actionQueueStore.stop()
    isSessionActive.value = false
    sessionStartTime.value = null
  }

  function startSession() {
    if (!isSessionActive.value) {
      isSessionActive.value = true
      sessionStartTime.value = performance.now()
      actionQueueStore.load()
    }
  }

  function stopSession() {
    if (isSessionActive.value) {
      isSessionActive.value = false
      actionQueueStore.stop()
    }
  }

  function resetSession() {
    // Reset the current session
    stopSession()
    initializeSession()
  }

  // 保留一些兼容性方法，但实际上委托给 ActionQueue store
  function addActionToQueue(target: ActionTarget, amount: number = Infinity) {
    actionQueueStore.addAction(target, amount)
    // 如果会话未开始，自动开始
    if (!isSessionActive.value) {
      startSession()
    }
  }

  function removeQueuedAction(index: number) {
    actionQueueStore.removeAction(index)
  }

  function clearActionQueue() {
    actionQueueStore.clearQueue()
  }

  // Queue manipulation methods - 委托给 ActionQueue store
  function moveActionUp(index: number) {
    actionQueueStore.moveUp(index)
  }

  function moveActionDown(index: number) {
    actionQueueStore.moveDown(index)
  }

  function moveActionToTop(index: number) {
    actionQueueStore.moveTop(index)
  }

  function moveActionToBottom(index: number) {
    actionQueueStore.moveBottom(index)
  }

  return {
    // State
    isSessionActive,
    sessionStartTime,

    // 暴露 ActionQueue store 的状态供兼容性使用
    queuedActions: actionQueueStore.queueingActions,
    currentAction: actionQueueStore.currentAction,

    // Session methods
    initializeSession,
    startSession,
    stopSession,
    resetSession,

    // Compatibility methods
    addActionToQueue,
    removeQueuedAction,
    clearActionQueue,
    moveActionUp,
    moveActionDown,
    moveActionToTop,
    moveActionToBottom,
  }
})
