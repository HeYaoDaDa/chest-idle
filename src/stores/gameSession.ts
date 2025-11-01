import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'
import { Action } from '@/models/activity/Action'
import { CurrentAction } from '@/models/activity/CurrentAction'
import type { ActionTarget } from '@/models/actionTarget'

export const useGameSessionStore = defineStore('gameSession', () => {
  // Current game session state
  const queuedActions = shallowReactive([] as Action[])
  const currentAction = shallowRef(undefined as undefined | CurrentAction)

  // Action queue management
  function addActionToQueue(target: ActionTarget, amount: number = Infinity) {
    queuedActions.push(new Action(target, amount))
  }

  function removeQueuedAction(index: number) {
    if (index >= 0 && index < queuedActions.length) {
      queuedActions.splice(index, 1)
    }
  }

  function clearActionQueue() {
    queuedActions.splice(0, queuedActions.length)
  }

  function setCurrentAction(action: CurrentAction | undefined) {
    currentAction.value = action
  }

  // Queue manipulation methods
  function moveActionUp(index: number) {
    if (index > 0 && index < queuedActions.length) {
      const temp = queuedActions[index]
      queuedActions[index] = queuedActions[index - 1]
      queuedActions[index - 1] = temp
    }
  }

  function moveActionDown(index: number) {
    if (index >= 0 && index < queuedActions.length - 1) {
      const temp = queuedActions[index]
      queuedActions[index] = queuedActions[index + 1]
      queuedActions[index + 1] = temp
    }
  }

  function moveActionToTop(index: number) {
    if (index > 0 && index < queuedActions.length) {
      const action = queuedActions.splice(index, 1)[0]
      queuedActions.unshift(action)
    }
  }

  function moveActionToBottom(index: number) {
    if (index >= 0 && index < queuedActions.length - 1) {
      const action = queuedActions.splice(index, 1)[0]
      queuedActions.push(action)
    }
  }

  // Session management
  function initializeSession() {
    // Initialize a new game session
    clearActionQueue()
    setCurrentAction(undefined)
  }

  function resetSession() {
    // Reset the current session
    initializeSession()
  }

  return {
    // State
    queuedActions,
    currentAction,

    // Methods
    addActionToQueue,
    removeQueuedAction,
    clearActionQueue,
    setCurrentAction,
    moveActionUp,
    moveActionDown,
    moveActionToTop,
    moveActionToBottom,
    initializeSession,
    resetSession,
  }
})
