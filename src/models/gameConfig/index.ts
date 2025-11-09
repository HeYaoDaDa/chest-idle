import type { ActionConfig } from './actionTarget'
import type { ItemConfig } from './item'
import type { SkillConfig } from './SkillConfig'
import type { SlotConfig } from './SlotConfig'

export type GameConfig =
  | SkillConfig
  | SlotConfig
  | ItemConfig
  | ActionConfig
