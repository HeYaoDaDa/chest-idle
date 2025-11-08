// 属性类型枚举
export enum PropertyType {
  // 全局属性
  GLOBAL_ACTION_SPEED = 'global.actionSpeed',
  GLOBAL_XP_GAIN = 'global.xpGain',
  GLOBAL_CHEST_POINTS = 'global.chestPoints',

  // 技能速度属性（按技能ID动态生成，如 "foraging.speed"）
  // 使用工厂函数创建
}

// 工厂函数：生成技能相关的属性类型
export function getSkillSpeedProperty(skillId: string): string {
  return `${skillId}.speed`
}

export function getSkillXpProperty(skillId: string): string {
  return `${skillId}.xp`
}

export function getSkillChestPointsProperty(skillId: string): string {
  return `${skillId}.chestPoints`
}
