export type {
  SkillConfig,
  SlotConfig,
  StatConfig,
  ItemConfig,
  ActionConfig,
  GameConfig,
  EffectType,
  EffectConfig,
  LootEntryConfig,
}

type GameConfig = SkillConfig | SlotConfig | StatConfig | ItemConfig | ActionConfig

interface SkillConfig {
  type: 'skill'
  id: string
  sort: number
  name: string
  description: string
}

interface SlotConfig {
  type: 'slot'
  id: string
  sort: number
  name: string
  description: string
}

interface StatConfig {
  type: 'stat'
  id: string
  sort: number
  base?: number
  name: string
  description: string
}

interface ItemConfig {
  type: 'item'
  category: 'resource' | 'chest' | 'equipment'
  id: string
  sort: number
  chest?: {
    maxPoints: number
    loots: LootEntryConfig[]
  }
  equipment?: {
    slotId: string
    effects: EffectConfig[]
  }
  name: string
  description: string
}

interface ActionConfig {
  type: 'action'
  id: string
  skillId: string
  tab?: string
  minLevel: number
  sort: number
  duration: number
  xp: number
  chestId: string
  chestPoints: number
  ingredients?: { itemId: string; count: number }[]
  products: { itemId: string; count: number }[]
  name: string
  description: string
}

type EffectType = 'flat' | 'percentage' | 'inversePercentage'

interface EffectConfig {
  statId: string
  type: EffectType
  value: number
}

interface LootEntryConfig {
  itemId: string
  chance: number
  min: number
  max: number
}
