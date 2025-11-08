import type { Effect } from './Effect'

export class State {
  private effectMap = new Map<string, Effect>()

  constructor(public base: number) {}

  addEffect(id: string, effect: Effect) {
    this.effectMap.set(id, effect)
  }

  removeEffect(id: string) {
    this.effectMap.delete(id)
  }

  getValue(): number {
    let flat = 0
    let percentage = 0
    let inversePercentage = 0

    for (const effect of this.effectMap.values()) {
      const value = effect.getValue()
      switch (effect.type) {
        case 'flat':
          flat += value
          break
        case 'percentage':
          percentage += value
          break
        case 'inversePercentage':
          inversePercentage += value
          break
      }
    }

    return ((this.base + flat) * (1 + percentage)) / (1 + inversePercentage)
  }
}
