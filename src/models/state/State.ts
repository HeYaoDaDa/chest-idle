import { computed, shallowReactive, type ComputedRef, type ShallowReactive } from 'vue'
import type { Effect } from './Effect'

export class State {
  effectMap: ShallowReactive<Map<string, Effect>> = shallowReactive(new Map())
  _value: ComputedRef<number> = computed(() => {
    let flat = 0
    let percentage = 0
    let inversePercentage = 0
    for (const effect of this.effectMap.values()) {
      switch (effect.type) {
        case 'flat':
          flat += effect.value
          break
        case 'percentage':
          percentage += effect.value
          break
        case 'inversePercentage':
          inversePercentage += effect.value
          break
      }
    }
    return ((this.base + flat) * (1 + percentage)) / (1 + inversePercentage)
  })
  get value(): number {
    return this._value.value
  }

  constructor(public base: number) {}

  addEffect(id: string, effect: Effect) {
    this.effectMap.set(id, effect)
  }

  removeEffect(id: string) {
    this.effectMap.delete(id)
  }
}
