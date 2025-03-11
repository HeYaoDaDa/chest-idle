import { defineStore } from "pinia";
import { reactive } from "vue";
import { useDataStore } from "./data";
import { useNotificationStore } from "./notification";
import { useI18n } from "vue-i18n";

export const useCharacterStore = defineStore('character', () => {
  const dataStore = useDataStore();
  const notificationStore = useNotificationStore();
  const { t } = useI18n();

  const skillMap = reactive(new Map(dataStore.allSkillDatas.map((it) => [it.id, {
    skill: it,
    xp: 0,
    level: computeLevel(0),
  }])));

  const allSkills = Array.from(skillMap.values());

  function getSkillById(id: string) {
    return skillMap.get(id)
  }

  function addXp(id: string, xp: number) {
    const skill = skillMap.get(id);
    if (skill) {
      const oldLevel = skill.level;
      skill.xp += xp;
      skill.level = computeLevel(skill.xp);
      if (skill.level > oldLevel) {
        notificationStore.notification('info', t('notification.levelUp', { skill: skill.skill.getName(), level: skill.level }))
      }
    } else {
      console.error(`Skill ${id} not find`)
    }
  }

  function computeLevel(xp: number): number {
    return Math.floor(xp / 100);
  }

  return {
    allSkills,
    getSkillById,
    addXp
  }
});
