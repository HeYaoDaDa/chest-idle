import { shallowReactive, shallowRef } from 'vue'
import { Action } from '../activity/Action'
import { CurrentAction } from '../activity/CurrentAction'
import type { ActionTarget } from '../actionTarget'
import { notificationManager } from './NotificationManager'
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
    const elapsed = now - actionManager.lastUpdateDate
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

  public startCurrentAction(target: ActionTarget, amount: number = Infinity): boolean {
    if (target.skill.level.value < target.minLevel) {
      console.warn(
        `Required level ${target.minLevel} for action ${target.id}, but current level is ${target.skill.level.value}`,
      )
      notificationManager.warning('notification.levelTooLow', {
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
      notificationManager.warning('notification.notEnoughMaterials', {
        action: i18n.global.t(target.name),
      })
      return false
    }
  }

  public autoFillCurrentAction() {
    while (this.queuedActions.length > 0) {
      const queuedAction = this.queuedActions.shift()!
      if (this.startCurrentAction(queuedAction.target, queuedAction.amount)) {
        break
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
}

export const actionManager = new ActionManager()
