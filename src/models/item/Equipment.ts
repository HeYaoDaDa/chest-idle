import { Item } from '.'
import type { EffectDefinition } from '../definitions/misc/EffectDefinition'
import type { Slot } from '../Slot'
import type { EffectType } from '@/constants'

export interface EquipmentEffect {
  property: string
  type: EffectType
  value: number
}

export class Equipment extends Item {
  type = 'equipment' as const
  slot: Slot
  effects: EquipmentEffect[]
  constructor(id: string, sortId: number, slot: Slot, effects: EffectDefinition[]) {
    super(id, sortId)
    this.slot = slot
    this.effects = effects.map((it) => ({
      property: it.property,
      type: it.type,
      value: it.value,
    }))
  }
}
