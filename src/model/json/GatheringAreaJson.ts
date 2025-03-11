import type { LootJson } from "./LootJson";

export interface GatheringAreaJson {
  id: string;
  skill: string;

  sort: number;
  baseTime: number;
  xp: number;
  products: LootJson[];
}
