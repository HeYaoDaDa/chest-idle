import type { Chest } from '../item/Chest'
import type { Item } from '../item'
import type { PropertyManager, PropertyCalculation } from '../property'
import { PropertyType, getSkillSpeedProperty } from '../property'

export class ActionTarget {
  name: string
  description: string
  skillId: string
  chest: Chest
  ingredients: { item: Item; count: number }[] = []
  products: { item: Item; count: number }[] = []

  // 基础值
  private baseDuration: number
  private baseXp: number
  private baseChestPoints: number
  private propertyManager: PropertyManager
  public minLevel: number
  private getSkillLevel: () => number

  constructor(
    public id: string,
    skillId: string,
    public tab: string | undefined,
    minLevel: number,
    public sort: number,
    baseDuration: number,
    baseXp: number,
    chest: Chest,
    baseChestPoints: number,
    ingredients: { item: Item; count: number }[],
    product: { item: Item; count: number }[],
    getSkillLevel: () => number,
    propertyManager: PropertyManager,
  ) {
    this.name = `actionTarget.${this.id}.name`
    this.description = `actionTarget.${this.id}.description`
    this.skillId = skillId
    this.minLevel = minLevel
    this.getSkillLevel = getSkillLevel
    this.propertyManager = propertyManager

    // 保存基础值
    this.baseDuration = baseDuration
    this.baseXp = baseXp
    this.baseChestPoints = baseChestPoints

    this.chest = chest
    this.ingredients.push(...ingredients)
    this.products.push(...product)
  }

  // ========== 属性系统方法 ==========

  /**
   * 获取持续时间（带详情）
   */
  getDurationDetail(): PropertyCalculation {
    // 收集所有修改器
    const allModifiers: PropertyCalculation['breakdown'] = []

    // 1. 应用技能速度修改器
    const skillSpeedCalc = this.propertyManager.calculate(getSkillSpeedProperty(this.skillId), 0)
    allModifiers.push(...skillSpeedCalc.breakdown)

    // 2. 应用全局速度修改器
    const globalSpeedCalc = this.propertyManager.calculate(PropertyType.GLOBAL_ACTION_SPEED, 0)
    allModifiers.push(...globalSpeedCalc.breakdown)

    // 3. 添加超级加速（特殊效果）
    const overLevelBonus = Math.max(0, (this.getSkillLevel() - this.minLevel) * 0.01)
    if (overLevelBonus > 0) {
      allModifiers.push({
        sourceId: `overLevel.${this.skillId}`,
        sourceName: 'effect.overLevelSpeedUp',
        type: 'inversePercentage',
        value: overLevelBonus,
      })
    }

    // 计算最终值
    let flat = 0
    let percentage = 0
    let inversePercentage = 0

    for (const modifier of allModifiers) {
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

    const finalValue = ((this.baseDuration + flat) * (1 + percentage)) / (1 + inversePercentage)

    return {
      finalValue,
      baseValue: this.baseDuration,
      breakdown: allModifiers,
    }
  }

  /**
   * 获取经验值（带详情）
   */
  getXpDetail(): PropertyCalculation {
    const allModifiers: PropertyCalculation['breakdown'] = []

    // 应用全局经验加成
    const globalXpCalc = this.propertyManager.calculate(PropertyType.GLOBAL_XP_GAIN, 0)
    allModifiers.push(...globalXpCalc.breakdown)

    // 计算最终值
    let flat = 0
    let percentage = 0
    let inversePercentage = 0

    for (const modifier of allModifiers) {
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

    const finalValue = ((this.baseXp + flat) * (1 + percentage)) / (1 + inversePercentage)

    return {
      finalValue,
      baseValue: this.baseXp,
      breakdown: allModifiers,
    }
  }

  /**
   * 获取宝箱点数（带详情）
   */
  getChestPointsDetail(): PropertyCalculation {
    const allModifiers: PropertyCalculation['breakdown'] = []

    // 应用全局宝箱点数加成
    const globalChestPointsCalc = this.propertyManager.calculate(
      PropertyType.GLOBAL_CHEST_POINTS,
      0
    )
    allModifiers.push(...globalChestPointsCalc.breakdown)

    // 计算最终值
    let flat = 0
    let percentage = 0
    let inversePercentage = 0

    for (const modifier of allModifiers) {
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

    const finalValue = ((this.baseChestPoints + flat) * (1 + percentage)) / (1 + inversePercentage)

    return {
      finalValue,
      baseValue: this.baseChestPoints,
      breakdown: allModifiers,
    }
  }

  // ========== 便捷方法（仅获取值） ==========

  getDuration(): number {
    return this.getDurationDetail().finalValue
  }

  getXp(): number {
    return this.getXpDetail().finalValue
  }

  getChestPoints(): number {
    return this.getChestPointsDetail().finalValue
  }
}
