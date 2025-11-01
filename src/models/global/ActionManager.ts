import { shallowReactive, shallowRef } from 'vue'
import { Action } from '../activity/Action'
import { CurrentAction } from '../activity/CurrentAction'
import type { ActionTarget } from '../actionTarget'
import { useNotificationStore } from '@/stores/notification'
import i18n from '@/i18n'

class ActionManager {
  public queuedActions = shallowReactive([] as Action[])
  public currentAction = shallowRef(undefined as undefined | CurrentAction)
  private lastUpdateDate = performance.now()

  public load() {
    requestAnimationFrame(actionManager.update)
  }

  private update() {
    const now = performance.now()
    const elapsed = (now - actionManager.lastUpdateDate) * 100
    actionManager.lastUpdateDate = now

    let remainedElapsed = elapsed
    while (actionManager.currentAction.value && remainedElapsed > 0) {
      remainedElapsed = actionManager.currentAction.value.update(remainedElapsed)
    }

    requestAnimationFrame(actionManager.update)
  }

  public addAction(target: ActionTarget, amount: number = Infinity) {
    if (this.currentAction.value) {
      this.queuedActions.push(new Action(target, amount))
    } else {
      this.startCurrentAction(target, amount)
    }
  }

  public removeQueueAction(index: number) {
    if (this.queuedActions.length > index) {
      this.queuedActions.splice(index, 1)
    }
  }

  public clearQueue() {
    this.queuedActions.splice(0, this.queuedActions.length)
  }

  public startCurrentAction(target: ActionTarget, amount: number = Infinity): boolean {
    if (target.skill.level.value < target.minLevel) {
      console.warn(
        `Required level ${target.minLevel} for action ${target.id}, but current level is ${target.skill.level.value}`,
      )
      const notificationStore = useNotificationStore()
      notificationStore.warning('notification.levelTooLow', {
        skill: i18n.global.t(target.skill.name),
        level: target.skill.level.value,
        required: target.minLevel,
        action: i18n.global.t(target.name),
      })
      return false
    }
    const actualAmount = CurrentAction.computeAmount(target, amount)
    if (actualAmount > 0) {
      this.currentAction.value = new CurrentAction(target, actualAmount)
      return true
    } else {
      const notificationStore = useNotificationStore()
      notificationStore.warning('notification.notEnoughMaterials', {
        action: i18n.global.t(target.name),
      })
      return false
    }
  }

  public autoFillCurrentAction() {
    // Do not discard unstartable actions; try in-order and pick the first startable one
    for (let i = 0; i < this.queuedActions.length; i++) {
      const qa = this.queuedActions[i]
      if (this.startCurrentAction(qa.target, qa.amount)) {
        this.queuedActions.splice(i, 1)
        return
      }
    }
  }

  public stopCurrentAction() {
    if (this.currentAction.value) {
      this.currentAction.value.finalize()
      this.currentAction.value = undefined
      this.autoFillCurrentAction()
    } else {
      console.error('currentAction is null')
    }
  }

  /** Insert a new action to the very front of the queue (right after running). */
  public insertFront(target: ActionTarget, amount: number = Infinity): void {
    if (this.currentAction.value) {
      this.queuedActions.unshift(new Action(target, amount))
    } else {
      // If nothing is running, start immediately
      this.startCurrentAction(target, amount)
    }
  }

  /**
   * Start an action immediately. If something is running, interrupt it and
   * push the old running action to the front of the queue, then start the new action.
   */
  public startImmediately(target: ActionTarget, amount: number = Infinity): void {
    if (this.currentAction.value) {
      // Save the current running action
      const old = this.currentAction.value
      const remain = old.amount.value
      // Insert old current to the very front of the queue
      this.queuedActions.unshift(new Action(old.target, remain))
      // Stop current (will trigger autoFill, but we'll override immediately)
      this.currentAction.value.finalize()
      this.currentAction.value = undefined
      // Start the new action immediately
      this.startCurrentAction(target, amount)
    } else {
      // Nothing running, just start it
      this.startCurrentAction(target, amount)
    }
  }

  public finishCurrentAction(count: number) {
    if (this.currentAction.value) {
      if (this.currentAction.value.amount.value === count) {
        this.stopCurrentAction()
      } else if (this.currentAction.value.amount.value > count) {
        this.currentAction.value.amount.value -= count
      } else {
        console.error(`currentAction size ${this.currentAction.value.amount.value} less ${count}`)
      }
    } else {
      console.error('currentAction is null')
    }
  }

  // ============ Reorder (Unified Index: 0 is running, then queued) ============
  public unifiedLength(): number {
    return (this.currentAction.value ? 1 : 0) + this.queuedActions.length
  }

  public moveUp(index: number): void {
    if (index <= 0 || index >= this.unifiedLength()) return
    // index > 0
    if (this.currentAction.value) {
      if (index === 1) {
        // swap queued[0] with current (interrupt current)
        this.swapCurrentWithFirstQueued()
      } else {
        // swap inside queued (index-1 and index-2)
        const a = index - 1
        const b = index - 2
        this.swapQueued(a, b)
      }
    } else {
      // no current, swap inside queued (index and index-1)
      this.swapQueued(index, index - 1)
    }
  }

  public moveDown(index: number): void {
    const len = this.unifiedLength()
    if (index < 0 || index >= len - 1) return
    if (this.currentAction.value) {
      if (index === 0) {
        // move current down by one (swap with queued[0])
        this.swapCurrentWithFirstQueued()
      } else {
        // swap inside queued (index-1 and index)
        const a = index - 1
        const b = index
        this.swapQueued(a, b)
      }
    } else {
      // no current, swap inside queued (index and index+1)
      this.swapQueued(index, index + 1)
    }
  }

  public moveTop(index: number): void {
    if (index <= 0 || index >= this.unifiedLength()) return
    if (this.currentAction.value) {
      // move item at unified index to the very front and then interrupt current
      const queuedIndex = index - 1
      this.makeQueuedIndexCurrent(queuedIndex)
    } else {
      // no current, simply move to front inside queued
      const item = this.queuedActions.splice(index, 1)[0]
      if (item) this.queuedActions.unshift(item)
    }
  }

  public moveBottom(index: number): void {
    const len = this.unifiedLength()
    if (index < 0 || index >= len) return
    if (len <= 1) return

    if (this.currentAction.value) {
      if (index === 0) {
        // move current to bottom: push remain to end and interrupt to let next start
        const old = this.currentAction.value!
        const remain = old.amount.value
        this.queuedActions.push(new Action(old.target, remain))
        this.stopCurrentAction()
      } else {
        // move queued[index-1] to end
        const qIndex = index - 1
        const item = this.queuedActions.splice(qIndex, 1)[0]
        if (item) this.queuedActions.push(item)
      }
    } else {
      // no current
      const item = this.queuedActions.splice(index, 1)[0]
      if (item) this.queuedActions.push(item)
    }
  }

  private swapQueued(a: number, b: number) {
    if (a < 0 || b < 0) return
    if (a >= this.queuedActions.length || b >= this.queuedActions.length) return
    ;[this.queuedActions[a], this.queuedActions[b]] = [this.queuedActions[b], this.queuedActions[a]]
  }

  private swapCurrentWithFirstQueued() {
    if (!this.currentAction.value) return
    if (this.queuedActions.length === 0) return
    const old = this.currentAction.value
    const remain = old.amount.value
    // place old current just after the first queued (effectively swapping after we stop)
    this.queuedActions.splice(1, 0, new Action(old.target, remain))
    // interrupt current -> auto fill will start the first queued
    this.stopCurrentAction()
  }

  private makeQueuedIndexCurrent(queuedIndex: number) {
    if (queuedIndex < 0 || queuedIndex >= this.queuedActions.length) return
    const item = this.queuedActions.splice(queuedIndex, 1)[0]
    if (!item) return
    // put chosen item at the very front of queue
    this.queuedActions.unshift(item)
    if (this.currentAction.value) {
      // preserve current as a queued item right after the new front
      const old = this.currentAction.value
      const remain = old.amount.value
      this.queuedActions.splice(1, 0, new Action(old.target, remain))
      // now interrupt current; auto fill will start the new front item
      this.stopCurrentAction()
    }
  }
}

export const actionManager = new ActionManager()
