import type { ItemType, EffectType } from '@/constants'
import type { Slot } from '../Slot'
import type { LootEntryDefinition } from '../definitions/misc/LootEntryDefinition'

// Equipment specific data
export interface EquipmentData {
  slot: Slot
  effects: {
    property: string
    type: EffectType
    value: number
  }[]
}

// Chest specific data
export interface ChestData {
  maxPoints: number
  loots: {
    item: Item
    chance: number
    min: number
    max: number
  }[]
}

// Extended Item type to temporarily hold loot definitions during initialization
interface ItemWithLootDefs extends Item {
  _lootDefs?: LootEntryDefinition[]
}

export class Item {
  name: string
  description: string

  constructor(
    public id: string,
    public sort: number,
    public category: ItemType,
    public equipment: EquipmentData | null = null,
    public chest: ChestData | null = null,
  ) {
    this.name = `item.${this.id}.name`
    this.description = `item.${this.id}.description`
  }

  isResource(): boolean {
    return this.category === 'resource'
  }

  isChest(): boolean {
    return this.category === 'chest'
  }

  isEquipment(): boolean {
    return this.category === 'equipment'
  }
}

export type { ItemWithLootDefs }
