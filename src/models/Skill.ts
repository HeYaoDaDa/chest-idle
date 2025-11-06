// 技能接口定义 - 现在由 skills store 管理状态
export interface Skill {
  id: string
  name: string
  description: string
  sort: number
  xp: number
  level: number
  remainingXpForUpgrade: number
  upgradeProgress: number
}

// 技能配置定义（用于从定义文件加载）
export interface SkillConfig {
  id: string
  name: string
  description: string
  sort: number
}
