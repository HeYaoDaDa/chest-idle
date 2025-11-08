import type { EffectType } from '@/constants'

export class Effect {
  constructor(
    public type: EffectType,
    private _valueGetter: () => number,
  ) {}

  getValue(): number {
    return this._valueGetter()
  }
}
