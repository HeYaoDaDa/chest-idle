import type { ActionConfig } from './ActionConfig'
import type { ItemConfig } from './ItemConfig'
import type { SkillConfig } from './SkillConfig'
import type { SlotConfig } from './SlotConfig'

export type GameConfig =
  | SkillConfig
  | SlotConfig
  | ItemConfig
  | ActionConfig

// Config maps
export const skillConfigMap: Record<string, SkillConfig> = {}
export const slotConfigMap: Record<string, SlotConfig> = {}
export const itemConfigMap: Record<string, ItemConfig> = {}
export const actionConfigMap: Record<string, ActionConfig> = {}
// Config lists
export const skillConfigs: SkillConfig[] = [];
export const slotConfigs: SlotConfig[] = [];
export const actionConfigListBySkill: Record<string, ActionConfig[]> = {};

export function loadGameConfig() {
  const modules = import.meta.glob('/src/data/**/*.json', { eager: true, import: 'default' }) as Record<string, GameConfig[]>
  const gameConfigs = Object.values(modules).flat();
  // Separate configs
  for (const config of gameConfigs) {
    switch (config.type) {
      case 'skill':
        skillConfigMap[config.id] = (config as SkillConfig);
        break;
      case 'slot':
        slotConfigMap[config.id] = (config as SlotConfig);
        break;
      case 'item':
        itemConfigMap[config.id] = (config as ItemConfig);
        break;
      case 'action':
        actionConfigMap[config.id] = (config as ActionConfig);
        break;
    }
  }
  // Build skillConfigs
  for (const skillConfig of Object.values(skillConfigMap)) {
    skillConfigs.push(skillConfig);
  }
  skillConfigs.sort((a, b) => a.sort - b.sort);
  // Build slotConfigs
  for (const slotConfig of Object.values(slotConfigMap)) {
    slotConfigs.push(slotConfig);
  }
  slotConfigs.sort((a, b) => a.sort - b.sort);
  // Build actionConfigListBySkill
  for (const actionConfig of Object.values(actionConfigMap)) {
    if (!actionConfigListBySkill[actionConfig.skill]) {
      actionConfigListBySkill[actionConfig.skill] = [];
    }
    actionConfigListBySkill[actionConfig.skill].push(actionConfig);
  }
  for (const actionConfigs of Object.values(actionConfigListBySkill)) {
    actionConfigs.sort((a, b) => a.sort - b.sort);
  }
}
