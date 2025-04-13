import { computed, ref, type Ref } from "vue"
import type { Item } from "../item"
import { inventory } from "../global/InventoryManager"
import { dataManager } from "../global/DataManager"
import { Effect } from "../state/Effect"

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
}
