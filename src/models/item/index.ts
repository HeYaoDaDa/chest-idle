import type { ItemType } from "@/constants";
import type { Equipment } from "./Equipment";
import type { Resource } from "./Resource";
import type { Chest } from "./Chest";

export abstract class Item {
  abstract type: ItemType
  name: string
  description: string
  constructor(public id: string, public sort: number) {
    this.name = `item.${this.id}.name`;
    this.description = `item.${this.id}.description`;
  }
  isResource(): this is Resource {
    return this.type === 'resource';
  }
  isChest(): this is Chest {
    return this.type === 'chest';
  }
  isEquipment(): this is Equipment {
    return this.type === 'equipment';
  }
}
