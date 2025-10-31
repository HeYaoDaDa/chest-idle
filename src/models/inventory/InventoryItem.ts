import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { Item } from '../item'
import { useInventoryStore } from '@/stores/inventory'
import { useDataStore } from '@/stores/data'
import { Effect } from '../state/Effect'
import type { Equipment } from '../item/Equipment'
import type { Chest } from '../item/Chest'
import i18n from '@/i18n'

export class InventoryItem {
  amount: Ref<number>
  amountDisplay: ComputedRef<string> = computed(() =>
    this.amount.value.toLocaleString(i18n.global.locale.value),
  )

  constructor(
    public item: Item,
    amount: number,
  ) {
    this.amount = ref(amount)
  }

  get quantity(): number {
    return this.amount.value
  }

  equip() {
    if (!this.item.isEquipment()) {
      console.error(`Item ${this.item.id} is not equipment`)
      return
    }

    const inventoryStore = useInventoryStore()
    const dataStore = useDataStore()
    const equipment = this.item as Equipment
    const slot = equipment.slot

    slot.unEquip()

    for (const inactiveEffect of equipment.effects) {
      const state = dataStore.getStateById(inactiveEffect.state)
  const effect = new Effect(inactiveEffect.type, computed(() => inactiveEffect.value))
      state.addEffect(slot.id, effect)
    }

    slot.equipment.value = equipment
    inventoryStore.remove(this, 1)
  }

  openChest() {
    if (!this.item.isChest()) {
      console.error(`Item ${this.item.id} is not a chest`)
      return
    }

    const chest = this.item as Chest
    const inventoryStore = useInventoryStore()
    inventoryStore.remove(this, 1)

    for (const loot of chest.loots) {
      if (Math.random() <= loot.chance) {
        const amount = InventoryItem.randomIntInclusive(loot.min, loot.max)
        inventoryStore.add(loot.item, amount)
      }
    }
  }

  private static randomIntInclusive(min: number, max: number): number {
    const lower = Math.ceil(min)
    const upper = Math.floor(max)
    return Math.floor(Math.random() * (upper - lower + 1)) + lower
  }
}
