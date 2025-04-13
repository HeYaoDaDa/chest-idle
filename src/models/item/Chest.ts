import { Item } from "."
import type { LootEntryDefinition } from "../definitions/misc/LootEntryDefinition"
import { dataManager } from "../global/DataManager"

export class Chest extends Item {
  type = "chest" as const
  loots: {
    item: Item,
    chance: number,
    min: number,
    max: number
  }[]
  constructor(id: string, sort: number, loots: LootEntryDefinition[]) {
    super(id, sort);
    this.loots = loots.map(it => ({
      ...it,
      item: dataManager.getItemById(it.item)
    }));
  }
}
