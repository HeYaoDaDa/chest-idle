import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { Item } from '../item'
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

  // Note: equip() and openChest() methods have been moved to the store/composable level
  // to avoid circular dependencies and follow better separation of concerns
  // These actions are now handled by the PlayerStore and related composables

  private static randomIntInclusive(min: number, max: number): number {
    const lower = Math.ceil(min)
    const upper = Math.floor(max)
    return Math.floor(Math.random() * (upper - lower + 1)) + lower
  }

  static rollLoot(chest: Chest): { itemId: string; amount: number }[] {
    const results: { itemId: string; amount: number }[] = []

    for (const loot of chest.loots) {
      if (Math.random() <= loot.chance) {
        const amount = InventoryItem.randomIntInclusive(loot.min, loot.max)
        results.push({ itemId: loot.item.id, amount })
      }
    }

    return results
  }
}
