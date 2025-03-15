import i18n from '@/i18n'
import type { SkillJson } from '../json/SkillJson'

export class SkillData {
  constructor(
    public id: string,
    public sort: number,
  ) {}

  static fromJson(skillJson: SkillJson): SkillData {
    return new SkillData(skillJson.id, skillJson.sort)
  }

  getName(): string {
    return i18n.global.t(`skill.${this.id}.name`)
  }

  getDescription(): string {
    return i18n.global.t(`skill.${this.id}.description`)
  }
}
