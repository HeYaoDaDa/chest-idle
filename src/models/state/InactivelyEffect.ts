import type { EffectType } from '@/constants'

export class InactivelyEffect {
  constructor(
    public state: string,
    public type: EffectType,
    public value: number,
  ) {}
}
