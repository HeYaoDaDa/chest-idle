import { computed, ref, type Ref } from "vue"
import type { Item } from "../item"
import { inventory } from "../global/InventoryManager"
import { dataManager } from "../global/DataManager"
import { Effect } from "../state/Effect"
import MersenneTwister from "mersenne-twister"

export class InventoryItem {
  amount: Ref<number>

  constructor(
    public item: Item,
    amount: number,
  ) {
    this.item = item
    this.amount = ref(amount)
  }

  equip() {
    if (this.item.isEquipment()) {
      inventory.remove(this, 1);
      this.item.slot.unEquip();
      for (const effect of this.item.effects) {
        const state = dataManager.getStateById(effect.state);
        state.addEffect(this.item.slot.id, new Effect(effect.type, computed(() => effect.value)));
      }
      this.item.slot.equipment.value = this.item;
    }
  }

  openChest() {
    if (this.item.isChest()) {
      inventory.remove(this, 1);
      const products = this.item.loots;
      const result = [] as [Item, number][];
      for (const product of products) {
        const rng = new MersenneTwister();
        if (product.chance >= rng.random_incl()) {
          result.push([product.item, Math.floor(product.min + rng.random_incl() * (product.max - product.min + 1))]);
        }
      }
      inventory.addes(result);
    }
  }
}
