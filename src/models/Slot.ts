import { ref, type Ref } from 'vue'
import type { Equipment } from './item/Equipment'
import { useDataStore } from '@/stores/data'
import { useInventoryStore } from '@/stores/inventory'

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

  unEquip() {
    if (this.equipment.value) {
      const dataStore = useDataStore()
      const inventoryStore = useInventoryStore()
      for (const effect of this.equipment.value.effects) {
        const state = dataStore.getStateById(effect.state)
        state.removeEffect(this.id)
      }
      const equipment = this.equipment.value
      this.equipment.value = undefined
      inventoryStore.add(equipment, 1)
    }
  }
}
