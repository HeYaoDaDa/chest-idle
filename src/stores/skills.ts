import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePlayerStore } from './player'

// 技能接口定义
export interface SkillData {
  id: string
  name: string
  description: string
  sort: number
  xp: number
}

// 技能状态管理 - 现在作为 Player Store 的代理
export const useSkillsStore = defineStore('skills', () => {
  const playerStore = usePlayerStore()

  // 向后兼容的代理方法和属性
  const skillsXp = computed(() => playerStore.skillsXp)
  const skillsList = computed(() => playerStore.skillsList)
  const skills = computed(() => {
    const result: Record<string, SkillData & {
      level: number
      remainingXpForUpgrade: number
      upgradeProgress: number
      addXp: (xp: number) => void
    }> = {}
    for (const skill of playerStore.skillsList) {
      if (skill) {
        result[skill.id] = skill
      }
    }
    return result
  })

  // 代理方法
  function getSkillXp(skillId: string): number {
    return playerStore.getSkillXp(skillId)
  }

  function setSkillXp(skillId: string, xp: number) {
    playerStore.setSkillXp(skillId, xp)
  }

  function addSkillXp(skillId: string, xp: number) {
    playerStore.addSkillXp(skillId, xp)
  }

  function getSkillLevel(skillId: string): number {
    return playerStore.getSkillLevel(skillId)
  }

  function getRemainingXpForUpgrade(skillId: string): number {
    return playerStore.getRemainingXpForUpgrade(skillId)
  }

  function getUpgradeProgress(skillId: string): number {
    return playerStore.getUpgradeProgress(skillId)
  }

  function getSkill(skillId: string) {
    return playerStore.getSkill(skillId)
  }

  function resetSkill(skillId: string) {
    playerStore.resetSkill(skillId)
  }

  function resetAllSkills() {
    playerStore.resetAllSkills()
  }

  function getLevelFromXp(xp: number): number {
    return playerStore.getLevelFromXp(xp)
  }

  // 注册技能配置 - 现在直接委托给 gameConfig
  function registerSkillConfig() {
    // 这个方法现在由 gameConfig store 处理
    console.warn('registerSkillConfig is now handled by gameConfig store')
  }

  // 清除数据 - 委托给 player store
  function clear() {
    playerStore.resetAllSkills()
  }

  return {
    // 状态
    skillsXp,
    skills,
    skillsList,

    // 方法（向后兼容）
    getSkillXp,
    setSkillXp,
    addSkillXp,
    getSkillLevel,
    getRemainingXpForUpgrade,
    getUpgradeProgress,
    getSkill,
    registerSkillConfig,
    clear,
    resetSkill,
    resetAllSkills,
    getLevelFromXp
  }
})
