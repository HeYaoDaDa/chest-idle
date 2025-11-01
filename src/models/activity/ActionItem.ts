import type { ActionTarget } from '../actionTarget'
import { INFINITE_STRING } from '@/constants'

export type ActionStatus = 'queued' | 'running' | 'paused'

// ActionTarget的简化版本，专用于动作队列管理
// 保持为纯数据结构，避免Vue响应式类型的复杂性，便于序列化和性能优化
interface SimpleActionTarget {
  id: string
  type: string
  name: string
  skill: {
    id: string
    name: string
    level: number
    remainingXpForUpgrade: number
    addXp: (xp: number) => void
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
    addPoint: (points: number) => number
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
  status: ActionStatus
  startTime?: number
  elapsed: number
  id: string // 用于唯一标识，便于操作
}

export function createActionItem(
  target: ActionTarget,
  amount: number = Infinity,
  status: ActionStatus = 'queued'
): ActionItem {
  return {
    target,
    amount,
    status,
    elapsed: 0,
    id: `${target.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }
}

export function getActionItemDisplay(item: ActionItem): {
  amountDisplay: string
  skill: ActionItem['target']['skill']
} {
  return {
    amountDisplay: item.amount === Infinity ? INFINITE_STRING : item.amount.toLocaleString(),
    skill: item.target.skill
  }
}
