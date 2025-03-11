import type { LootJson } from "../json/LootJson";
import type { Item } from "./Item";

export class Loot {
  constructor(
    public item: Item,
    public percentage: number,
    public min: number,
    public max: number
  ) { }

  static fromJson(lootJson: LootJson, itemMap: Map<string, Item>): Loot {
    const item = itemMap.get(lootJson.id);
    if (!item) {
      throw `Not exist item ${lootJson.id}`;
    }
    return new Loot(
      item,
      lootJson.percentage,
      lootJson.min,
      lootJson.max
    );
  }
}
