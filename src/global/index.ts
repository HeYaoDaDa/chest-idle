import i18n from "@/i18n"
import type { Loot } from "@/model/data/Loot"
import { useCharacterStore } from "@/stores/character"
import { useDataStore } from "@/stores/data"
import { useNotificationStore } from "@/stores/notification"
import { storeToRefs } from "pinia"
import { type Ref, type ComputedRef, computed, watch } from "vue"

export interface SkillInterface {
  id: string
  xp: Ref<number>
  name: () => string
  description: () => string
  level: ComputedRef<number>
  progress: ComputedRef<number>
  nextLevelNeedXp: ComputedRef<number>
  areas: AreaInterface[]
  addXp: (xp: number) => void
}

export interface AreaInterface {
  id: string
  name: () => string
  description: () => string
  sort: number
  baseTime: number
  xp: number
  products: Loot[]
  skill: SkillInterface
}

class Global {
  public miningSkill!: SkillInterface
  public woodcuttingSkill!: SkillInterface
  public allSkills!: SkillInterface[]

  init() {
    const { t } = i18n.global
    const notificationStore = useNotificationStore()
    const dataStore = useDataStore()
    const characterStore = useCharacterStore()
    const { miningXp, woodcuttingXp } = storeToRefs(characterStore)

    this.miningSkill = {
      id: 'mining',
      xp: miningXp,
      name: () => t('skill.mining.name'),
      description: () => t('skill.mining.description'),
      level: computed(() => Math.floor(miningXp.value / 100)),
      progress: computed(() => miningXp.value % 100),
      nextLevelNeedXp: computed(() => 100 - (miningXp.value % 100)),
      areas: [],
      addXp: characterStore.addMiningXp,
    }
    watch(this.miningSkill.level, (newLevel) => {
      notificationStore.notification(
        'info',
        () => t('notification.levelUp', { skill: this.miningSkill.name(), level: newLevel }),
      )
    })

    this.woodcuttingSkill = {
      id: 'woodcutting',
      xp: woodcuttingXp,
      name: () => t('skill.woodcutting.name'),
      description: () => t('skill.woodcutting.description'),
      level: computed(() => Math.floor(woodcuttingXp.value / 100)),
      progress: computed(() => woodcuttingXp.value % 100),
      nextLevelNeedXp: computed(() => 100 - (woodcuttingXp.value % 100)),
      areas: [],
      addXp: characterStore.addWoodcuttingXp,
    }
    watch(this.woodcuttingSkill.level, (newLevel) => {
      notificationStore.notification(
        'info',
        () => t('notification.levelUp', { skill: this.woodcuttingSkill.name(), level: newLevel }),
      )
    })

    for (const [id, areas] of dataStore.gatheringAreasMap.entries()) {
      if ('woodcutting' == id) {
        this.woodcuttingSkill.areas.push(
          ...areas.map((it) => {
            return {
              id: it.id,
              name: () => t(`skillArea.${it.id}.name`),
              description: () => t(`skillArea.${it.id}.description`),
              sort: it.sort,
              baseTime: it.baseTime,
              xp: it.xp,
              products: it.products,
              skill: this.woodcuttingSkill,
            }
          }),
        )
      } else {
        this.miningSkill.areas.push(
          ...areas.map((it) => {
            return {
              id: it.id,
              name: () => t(`skillArea.${it.id}.name`),
              description: () => t(`skillArea.${it.id}.description`),
              sort: it.sort,
              baseTime: it.baseTime,
              xp: it.xp,
              products: it.products,
              skill: this.miningSkill,
            }
          }),
        )
      }
    }

    this.allSkills = [this.miningSkill, this.woodcuttingSkill];
  }
}

export const global = new Global();
