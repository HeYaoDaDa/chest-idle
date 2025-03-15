import type { GatheringAreaJson } from '../json/GatheringAreaJson'
import type { Item } from './Item'
import { Loot } from './Loot'
import type { SkillData } from './SkillData'
import i18n from '@/i18n'

export class GatheringArea {
  constructor(
    public id: string,
    public skill: SkillData,

    public sort: number,
    public baseTime: number,
    public xp: number,

    public products: Loot[],
  ) {}

  static fromJson(
    gatheringAreaJson: GatheringAreaJson,
    itemMap: Map<string, Item>,
    skillDataMap: Map<string, SkillData>,
  ): GatheringArea {
    const skillData = skillDataMap.get(gatheringAreaJson.skill)
    if (!skillData) {
      throw `Not exist skill ${gatheringAreaJson.skill}`
    }
    const products = gatheringAreaJson.products.map((it) => Loot.fromJson(it, itemMap))
    return new GatheringArea(
      gatheringAreaJson.id,
      skillData,

      gatheringAreaJson.sort,
      gatheringAreaJson.baseTime,
      gatheringAreaJson.xp,

      products,
    )
  }

  getName(): string {
    return i18n.global.t(`skillArea.${this.id}.name`)
  }

  getDescription(): string {
    return i18n.global.t(`skillArea.${this.id}.description`)
  }
}
