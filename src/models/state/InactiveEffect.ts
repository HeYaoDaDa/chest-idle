import type { EffectType } from '@/constants'

export class InactiveEffect {
  constructor(
    public state: string,
    public type: EffectType,
    public value: number,
  ) {}
}
