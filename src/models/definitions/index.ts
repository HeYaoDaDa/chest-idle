import type { ActionTargetDefinition } from "./actionTarget";
import type { ItemDefinition } from "./item";
import type { SkillDefinition } from "./SkillDefinition";
import type { SlotDefinition } from "./SlotDefinition";
import type { StateDefinition } from "./StateDefinition";

export type Definition =
  SkillDefinition
  | StateDefinition
  | SlotDefinition
  | ItemDefinition
  | ActionTargetDefinition
