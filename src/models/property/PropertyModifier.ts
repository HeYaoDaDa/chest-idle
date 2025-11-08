import type { EffectType } from '@/constants'

// 属性修改器 - 描述某个来源对属性的影响
export interface PropertyModifier {
  sourceId: string        // 来源唯一ID（如 "equipment.copper_pickaxe", "overLevel.woodcutting"）
  sourceName: string      // 来源显示名称（用于UI展示，i18n key）
  type: EffectType        // 修改类型：flat, percentage, inversePercentage
  value: number           // 修改值
}

// 属性计算结果 - 包含最终值和影响详情
export interface PropertyCalculation {
  finalValue: number              // 最终计算值
  baseValue: number               // 基础值
  breakdown: PropertyModifier[]   // 所有影响此属性的修改器列表
}

// 属性汇总 - 用于展示某个属性的总体影响
export interface PropertySummary {
  propertyType: string
  totalFlat: number
  totalPercentage: number
  totalInversePercentage: number
  modifiers: PropertyModifier[]
}
