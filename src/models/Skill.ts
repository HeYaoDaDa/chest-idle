import { XP_TABLE } from "@/constants"
import i18n from "@/i18n"
import { type Ref, type ComputedRef, ref, computed } from "vue"
import type { ActionTarget } from "./actionTarget"
import { notificationManager } from "./global/NotificationManager"

export class Skill {
  name: string
  description: string
  xp: Ref<number> = ref(0)
  level: ComputedRef<number>
  remainingXpForUpgrade: ComputedRef<number>
  upgradeProgress: ComputedRef<number>
  actionTargets: ActionTarget[] = []

  constructor(public id: string, public sort: number) {
    this.name = `skill.${this.id}.name`;
    this.description = `skill.${this.id}.description`;
    this.level = computed(() => this.getLevel())
    this.remainingXpForUpgrade = computed(() => (XP_TABLE[this.level.value + 1] ?? Infinity) - this.xp.value)
    this.upgradeProgress = computed(() => 1 - (this.remainingXpForUpgrade.value / ((XP_TABLE[this.level.value + 1] ?? Infinity) - (XP_TABLE[this.level.value] ?? 0))))
  }

  addXp(xp: number) {
    const previousLevel = this.getLevelFromValue(this.xp.value)
    this.xp.value += xp
    const currentLevel = this.getLevelFromValue(this.xp.value)

    if (currentLevel > previousLevel) {
      notificationManager.info('notification.levelUp', {
        skill: i18n.global.t(this.name),
        level: currentLevel,
      })
    }
  }

  private getLevel(): number {
    return this.getLevelFromValue(this.xp.value)
  }

  private getLevelFromValue(value: number): number {
    let left = 0;
    let right = XP_TABLE.length - 1;
    let result = 0;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (XP_TABLE[mid] <= value) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return result;
  }
}
