import { itemConfigMap } from '@/gameConfig'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChestPointStore = defineStore('chestPoint', () => {
  const chestPoints = ref<Record<string, number>>(Object.create(null))

  // ============ 宝箱进度管理功能 ============
  function getChestPoints(chestId: string): number {
    return chestPoints.value[chestId] ?? 0
  }

  function setChestPoints(chestId: string, points: number): void {
    chestPoints.value[chestId] = Math.max(0, points)
  }

  // 增加宝箱点数，返回可开箱的数量（整箱数）
  function addChestPoints(chestId: string, points: number): number {
    if (points <= 0) return 0
    const itemConfig = itemConfigMap[chestId]
    if (!itemConfig.chest) return 0
    const current = getChestPoints(chestId)
    const total = current + points
    const count = Math.floor(total / itemConfig.chest.maxPoints)
    const remainder = total % itemConfig.chest.maxPoints
    setChestPoints(chestId, remainder)
    return count
  }

  function getChestRemaining(chestId: string): number {
    const itemConfig = itemConfigMap[chestId]
    if (!itemConfig.chest) return 0
    return Math.max(0, itemConfig.chest.maxPoints - getChestPoints(chestId))
  }

  function getChestProgress(chestId: string): number {
    const itemConfig = itemConfigMap[chestId]
    if (!itemConfig.chest) return 0
    const points = getChestPoints(chestId)
    return itemConfig.chest.maxPoints > 0 ? points / itemConfig.chest.maxPoints : 0
  }

  return {
    chestPoints,

    // Methods - Chest Points
    getChestPoints,
    setChestPoints,
    addChestPoints,
    getChestRemaining,
    getChestProgress,
  }
})
