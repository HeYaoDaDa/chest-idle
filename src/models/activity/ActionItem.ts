// ActionTarget的简化版本，专用于动作队列管理
// 保持为纯数据结构，避免Vue响应式类型的复杂性，便于序列化和性能优化
interface SimpleActionTarget {
  id: string
  name: string
  skill: {
    id: string
    name: string
    level: number
    remainingXpForUpgrade: number
  }
  duration: { value: number }
  xp: { value: number }
  chestPoints: { value: number }
  minLevel: number
  chest: {
    id: string
    type: string
    name: string
    description: string
  }
  ingredients?: Array<{ item: { id: string }, count: number }>
  products: Array<{
    item: {
      id: string
      type: string
      name: string
      description: string
    }
    count: number
  }>
}

export interface ActionItem {
  target: SimpleActionTarget
  amount: number
}
