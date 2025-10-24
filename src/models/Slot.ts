import { ref, type Ref } from 'vue'
import type { Equipment } from './item/Equipment'
import { dataManager } from './global/DataManager'
import { inventory } from './global/InventoryManager'

export class Slot {
  equipment: Ref<Equipment | undefined> = ref(undefined)
  name: string

  constructor(
    public id: string,
    public sort: number,
  ) {
    this.name = `slot.${this.id}`
  }

  unEquip() {
    if (this.equipment.value) {
      for (const effect of this.equipment.value.effects) {
        const state = dataManager.getStateById(effect.state)
        state.removeEffect(this.id)
      }
      const equipment = this.equipment.value
      this.equipment.value = undefined
      inventory.add(equipment, 1)
    }
  }
}
