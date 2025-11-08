import type { ActionTargetDefinition } from './actionTarget'
import type { ItemDefinition } from './item'
import type { SkillDefinition } from './SkillDefinition'
import type { SlotDefinition } from './SlotDefinition'

export type Definition =
  | SkillDefinition
  | SlotDefinition
  | ItemDefinition
  | ActionTargetDefinition
