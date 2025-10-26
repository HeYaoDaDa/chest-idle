import type { ActionTarget } from '../actionTarget'
import type { Skill } from '../Skill'
import { INFINITE_STRING } from '@/constants'

export class Action {
  skill: Skill

  constructor(
    public target: ActionTarget,
    public amount: number,
  ) {
    this.skill = target.skill
  }

  get amountDisplay(): string {
    return this.amount === Infinity ? INFINITE_STRING : this.amount.toString()
  }
}
