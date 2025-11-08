import { reactive } from 'vue'
import type {
  PropertyModifier,
  PropertyCalculation,
  PropertySummary,
} from './PropertyModifier'

/**
 * 属性管理器 - 中心化管理所有属性修改器
 * 负责添加/移除修改器，并计算最终属性值
 *
 * 使用 Vue 的 reactive 包装，使其变化能被 Vue 追踪
 */
export class PropertyManager {
  // 存储：属性类型 -> 修改器数组（使用响应式 Map）
  private modifiers = reactive(new Map<string, PropertyModifier[]>())

  /**
   * 添加属性修改器
   * @param propertyType 属性类型（如 "global.actionSpeed" 或 "woodcutting.speed"）
   * @param modifier 修改器
   */
  addModifier(propertyType: string, modifier: PropertyModifier): void {
    if (!this.modifiers.has(propertyType)) {
      this.modifiers.set(propertyType, [])
    }
    const modifierList = this.modifiers.get(propertyType)!

    // 移除同一来源的旧修改器
    const index = modifierList.findIndex(m => m.sourceId === modifier.sourceId)
    if (index >= 0) {
      modifierList.splice(index, 1)
    }

    modifierList.push(modifier)
  }

  /**
   * 移除属性修改器
   * @param propertyType 属性类型
   * @param sourceId 来源ID
   */
  removeModifier(propertyType: string, sourceId: string): void {
    const modifierList = this.modifiers.get(propertyType)
    if (!modifierList) return

    const index = modifierList.findIndex(m => m.sourceId === sourceId)
    if (index >= 0) {
      modifierList.splice(index, 1)
    }

    // 如果列表为空，清理 Map
    if (modifierList.length === 0) {
      this.modifiers.delete(propertyType)
    }
  }

  /**
   * 移除某个来源的所有修改器
   * @param sourceId 来源ID
   */
  removeAllModifiersFromSource(sourceId: string): void {
    for (const [propertyType, modifierList] of this.modifiers.entries()) {
      const filtered = modifierList.filter(m => m.sourceId !== sourceId)
      if (filtered.length === 0) {
        this.modifiers.delete(propertyType)
      } else if (filtered.length !== modifierList.length) {
        this.modifiers.set(propertyType, filtered)
      }
    }
  }

  /**
   * 计算属性的最终值（带详情）
   * @param propertyType 属性类型
   * @param baseValue 基础值
   * @returns 计算结果，包含最终值和影响详情
   */
  calculate(propertyType: string, baseValue: number): PropertyCalculation {
    const modifierList = this.modifiers.get(propertyType) || []

    let flat = 0
    let percentage = 0
    let inversePercentage = 0

    for (const modifier of modifierList) {
      switch (modifier.type) {
        case 'flat':
          flat += modifier.value
          break
        case 'percentage':
          percentage += modifier.value
          break
        case 'inversePercentage':
          inversePercentage += modifier.value
          break
      }
    }

    const finalValue = ((baseValue + flat) * (1 + percentage)) / (1 + inversePercentage)

    return {
      finalValue,
      baseValue,
      breakdown: [...modifierList], // 返回副本
    }
  }

  /**
   * 仅获取最终值（不带详情，性能更好）
   * @param propertyType 属性类型
   * @param baseValue 基础值
   * @returns 最终值
   */
  getValue(propertyType: string, baseValue: number): number {
    return this.calculate(propertyType, baseValue).finalValue
  }

  /**
   * 获取某个属性的汇总信息
   * @param propertyType 属性类型
   * @returns 属性汇总
   */
  getSummary(propertyType: string): PropertySummary {
    const modifierList = this.modifiers.get(propertyType) || []

    let totalFlat = 0
    let totalPercentage = 0
    let totalInversePercentage = 0

    for (const modifier of modifierList) {
      switch (modifier.type) {
        case 'flat':
          totalFlat += modifier.value
          break
        case 'percentage':
          totalPercentage += modifier.value
          break
        case 'inversePercentage':
          totalInversePercentage += modifier.value
          break
      }
    }

    return {
      propertyType,
      totalFlat,
      totalPercentage,
      totalInversePercentage,
      modifiers: [...modifierList],
    }
  }

  /**
   * 获取所有活跃的属性类型列表
   */
  getAllActiveProperties(): string[] {
    return Array.from(this.modifiers.keys())
  }

  /**
   * 清空所有修改器
   */
  clear(): void {
    this.modifiers.clear()
  }
}
