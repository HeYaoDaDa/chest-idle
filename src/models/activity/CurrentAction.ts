import { type Ref, type ComputedRef, ref, computed, watchEffect } from "vue"
import type { ActionTarget } from "../actionTarget"
import type { Skill } from "../Skill"
import type { Item } from "../item"
import type { State } from "../state/State"
import { inventory } from "../global/InventoryManager"
import { actionManager } from "../global/ActionManager"
import i18n from "@/i18n"

export class CurrentAction {
  target: ActionTarget
  amount: Ref<number>
  amountDisplay: ComputedRef<string> = computed(() => this.amount.value.toLocaleString(i18n.global.locale.value))
  finalize: () => void

  skill: Skill
  startTime: number

  elapsed: Ref<number> = ref(0)

  duration: State
  xp: State
  chestPoints: State
  remainedDuration: ComputedRef<number>

  constructor(target: ActionTarget, amount: number) {
    this.target = target
    this.amount = ref(amount)
    this.skill = this.target.skill;
    this.startTime = performance.now();
    this.duration = target.duration;
    this.xp = target.xp;
    this.chestPoints = target.chestPoints;
    this.remainedDuration = computed(() => this.duration.value - this.elapsed.value)
    this.finalize = watchEffect(() => {
      let echaust = Infinity;
      if ("ingredients" in target) {
        const alls: number[] = []
        for (const ingredient of target.ingredients) {
          const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id);
          alls.push(inventoryItem ? Math.floor(inventoryItem.amount.value / ingredient.count) : 0);
        }
        echaust = Math.min(...alls, echaust);
      }
      this.amount.value = Math.min(this.amount.value, echaust);
    })
  }

  static computeAmount(target: ActionTarget, amount: number): number {
    let echaust = Infinity;
    if ("ingredients" in target) {
      const alls: number[] = []
      for (const ingredient of target.ingredients) {
        const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id);
        alls.push(inventoryItem ? Math.floor(inventoryItem.amount.value / ingredient.count) : 0);
      }
      echaust = Math.min(...alls, echaust);
    }
    return Math.min(amount, echaust);
  }

  public update(elapsed: number): number {
    if (elapsed < this.remainedDuration.value) {
      this.elapsed.value += elapsed;
      return 0;
    } else {
      let count = this.amount.value;
      count = Math.min(count, 1 + Math.floor((elapsed - this.remainedDuration.value) / this.duration.value))
      count = Math.min(count, Math.ceil(this.skill.remainingXpForUpgrade.value / this.xp.value))

      const ingredient = this.calculateIngredient(count);
      if (ingredient) inventory.removes(ingredient);

      this.skill.addXp(this.xp.value * count);
      const chestCount = this.target.chest.addPoint(this.chestPoints.value * count);
      const rewards = this.calculateRewards(count)
      if (chestCount > 0) {
        rewards.push([this.target.chest, chestCount]);
      }
      inventory.addes(rewards)

      const remainedElapsed = elapsed - (this.remainedDuration.value + this.duration.value * (count - 1));

      this.elapsed.value = 0;
      actionManager.finishCurrentAction(count);

      return remainedElapsed;
    }
  }

  calculateIngredient(count: number): [string, number][] | undefined {
    const result = [] as [string, number][]
    const loots = this.target.ingredients
    for (const loot of loots) {
      result.push([loot.item.id, loot.count * count])
    }
    return result
  }

  calculateRewards(count: number): [Item, number][] {
    const result = [] as [Item, number][]
    for (const loot of this.target.products) {
      result.push([
        loot.item,
        loot.count * count,
      ])
    }
    return result
  }
}
