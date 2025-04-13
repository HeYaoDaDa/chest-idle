import type { EffectType } from "@/constants";
import type { ComputedRef } from "vue";

export class Effect {
  get value(): number {
    return this._value.value;
  }
  constructor(
    public type: EffectType,
    private _value: ComputedRef<number>
  ) { }
}
