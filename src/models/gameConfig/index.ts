import type { ActionConfig } from './ActionConfig'
import type { ItemConfig } from './ItemConfig'
import type { SkillConfig } from './SkillConfig'
import type { SlotConfig } from './SlotConfig'

export type GameConfig =
  | SkillConfig
  | SlotConfig
  | ItemConfig
  | ActionConfig
