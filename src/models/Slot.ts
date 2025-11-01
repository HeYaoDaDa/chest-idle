import { ref, type Ref } from 'vue'
import type { Equipment } from './item/Equipment'

export class Slot {
  equipment: Ref<Equipment | undefined> = ref(undefined)
  name: string

  constructor(
    public id: string,
    public sort: number,
  ) {
    this.name = `slot.${this.id}`
  }

  get currentEquipment(): Equipment | undefined {
    return this.equipment.value
  }

  // Note: unEquip() method has been moved to the store/composable level
  // to avoid circular dependencies and follow better separation of concerns
  // This action is now handled by the PlayerStore and related composables

  clearEquipment() {
    this.equipment.value = undefined
  }

  setEquipment(equipment: Equipment) {
    this.equipment.value = equipment
  }
}
