import type { ActionTarget } from '../actionTarget'
import type { Skill } from '../Skill'

export class Action {
  skill: Skill

  constructor(
    public target: ActionTarget,
    public amount: number,
  ) {
    this.skill = target.skill
  }
}
