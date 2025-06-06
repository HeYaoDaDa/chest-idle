import { Item } from "."
import type { EffectDefinition } from "../definitions/misc/EffectDefinition"
import { dataManager } from "../global/DataManager"
import { Slot } from "../Slot"
import { InactivelyEffect } from "../state/InactivelyEffect"

export class Equipment extends Item {
  type = "equipment" as const
  slot: Slot
  effects: InactivelyEffect[]
  constructor(id: string, sortId: number, slot: string, effects: EffectDefinition[]) {
    super(id, sortId);
    this.slot = dataManager.getSlotById(slot);
    this.effects = effects.map(it => new InactivelyEffect(it.state, it.type, it.value));
  }
}
