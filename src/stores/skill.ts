import { XP_TABLE } from "@/constants";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useNotificationStore } from "./notification";
import { skillConfigMap, skillConfigs } from "@/models/gameConfig";
import i18n from "@/i18n";
import type { Skill } from "@/models/Skill";

export const useSkillStore = defineStore('skill', () => {
  const notificationStore = useNotificationStore()

  const skillXpMap = ref<Record<string, number>>({})

  // ============ 技能管理功能 ============

  // 获取技能经验值
  function getSkillXp(skillId: string): number {
    return skillXpMap.value[skillId] ?? 0
  }

  // 获取技能等级
  function getSkillLevel(skillId: string): number {
    return getLevelFromXp(getSkillXp(skillId))
  }

  // 获取升级所需剩余经验值
  function getRemainingXpForUpgrade(skillId: string): number {
    const currentXp = getSkillXp(skillId)
    const currentLevel = getLevelFromXp(currentXp)
    const nextLevelXp = XP_TABLE[currentLevel + 1] ?? Infinity
    return Math.max(0, nextLevelXp - currentXp)
  }

  // 获取升级进度 (0-1)
  function getUpgradeProgress(skillId: string): number {
    const currentXp = getSkillXp(skillId)
    const currentLevel = getLevelFromXp(currentXp)
    const currentLevelXp = XP_TABLE[currentLevel] ?? 0
    const nextLevelXp = XP_TABLE[currentLevel + 1] ?? Infinity

    if (nextLevelXp === Infinity) return 1

    return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)
  }

  // 添加技能经验值
  function addSkillXp(skillId: string, xp: number) {
    const previousLevel = getLevelFromXp(getSkillXp(skillId))
    const newXp = getSkillXp(skillId) + xp
    skillXpMap.value[skillId] = newXp
    const currentLevel = getLevelFromXp(newXp)

    // 升级通知
    if (currentLevel > previousLevel) {
      const skillConfig = skillConfigMap[skillId]
      if (skillConfig) {
        notificationStore.info('notification.levelUp', {
          skill: i18n.global.t(`skill.${skillConfig.id}.name`),
          level: currentLevel,
        })
      }
    }
  }

  // 获取技能完整信息
  function getSkill(skillId: string): Skill | undefined {
    const skillConfig = skillConfigMap[skillId]
    if (!skillConfig) return undefined

    return {
      ...skillConfig,
      name: `skill.${skillConfig.id}.name`,
      description: `skill.${skillConfig.id}.description`,
      xp: getSkillXp(skillId),
      level: getSkillLevel(skillId),
      remainingXpForUpgrade: getRemainingXpForUpgrade(skillId),
      upgradeProgress: getUpgradeProgress(skillId)
    }
  }

  // 获取所有技能列表
  const skillList = computed(() => {
    return Array.from(skillConfigs)
      .map(config => getSkill(config.id))
      .filter((skill): skill is NonNullable<typeof skill> => skill !== undefined)
      .sort((a, b) => a.sort - b.sort)
  })

  return {
    // State
    skillXpMap,

    // Getters
    skillList,

    // Methods
    getSkill,
    getSkillLevel,
    addSkillXp
  }
})

// 根据经验值计算等级
function getLevelFromXp(xp: number): number {
  let left = 0
  let right = XP_TABLE.length - 1
  let result = 0
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (XP_TABLE[mid] <= xp) {
      result = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return result
}
