import type { ItemJson } from "./ItemJson";
import type { GatheringAreaJson } from "./GatheringAreaJson";
import type { SkillJson } from "./SkillJson";

export interface DataJson {
  skills: SkillJson[];
  items: ItemJson[];
  gatheringAreas: GatheringAreaJson[];
}
