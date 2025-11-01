import { Item } from '.'
import type { EffectDefinition } from '../definitions/misc/EffectDefinition'
import type { Slot } from '../Slot'
import { InactiveEffect } from '../state/InactiveEffect'

export class Equipment extends Item {
  type = 'equipment' as const
  slot: Slot
  effects: InactiveEffect[]
  constructor(id: string, sortId: number, slot: Slot, effects: EffectDefinition[]) {
    super(id, sortId)
    this.slot = slot
    this.effects = effects.map((it) => new InactiveEffect(it.state, it.type, it.value))
  }
}
