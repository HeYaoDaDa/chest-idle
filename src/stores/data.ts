import { computed, markRaw, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { SkillData } from '@/model/data/SkillData'
import { Item } from '@/model/data/Item'
import { GatheringArea } from '@/model/data/GatheringArea'
import type { DataJson } from '@/model/json/DataJson'
import { global } from '@/global'

export const useDataStore = defineStore('data', () => {
  const skillDataMap = new Map<string, SkillData>()
  const itemMap = new Map<string, Item>()
  const gatheringAreaMap = new Map<string, GatheringArea>()
  const gatheringAreasMap = new Map<string, GatheringArea[]>()

  const dataStatus = ref('none' as 'none' | 'loading' | 'finish' | 'fail')

  const allSkillDatas = computed(() =>
    Array.from(skillDataMap.values()).sort((a, b) => a.sort - b.sort),
  )

  async function loadData() {
    dataStatus.value = 'loading'
    try {
      const response = await axios.get('/data.json')
      const gameDataJson = response.data as DataJson
      initData(gameDataJson)
      dataStatus.value = 'finish'
      global.init()
    } catch (error) {
      console.error('Failed to load data:', error)
      dataStatus.value = 'fail'
    }
  }
  function initData(data: DataJson) {
    for (const skillDataJson of data.skills) {
      skillDataMap.set(skillDataJson.id, markRaw(SkillData.fromJson(skillDataJson)))
    }
    for (const itemJson of data.items) {
      itemMap.set(itemJson.id, markRaw(Item.fromJson(itemJson)))
    }
    for (const gatheringAreaJson of data.gatheringAreas) {
      const gatheringArea = markRaw(
        GatheringArea.fromJson(gatheringAreaJson, itemMap, skillDataMap),
      )
      gatheringAreaMap.set(gatheringAreaJson.id, gatheringArea)
      const existGatheringAreas = gatheringAreasMap.get(gatheringAreaJson.skill)
      if (existGatheringAreas) {
        existGatheringAreas.push(gatheringArea)
        existGatheringAreas.sort((a, b) => a.sort - b.sort)
      } else {
        gatheringAreasMap.set(gatheringAreaJson.skill, [gatheringArea])
      }
    }
  }
  function getSkillById(id: string): SkillData | undefined {
    return skillDataMap.get(id)
  }
  function getItemById(id: string): Item | undefined {
    return itemMap.get(id)
  }
  function getGatheringAreaById(id: string): GatheringArea | undefined {
    return gatheringAreaMap.get(id)
  }
  function getGatheringAreasBySkillId(skillId: string): GatheringArea[] {
    return gatheringAreasMap.get(skillId) ?? []
  }

  return {
    dataStatus,
    allSkillDatas,
    gatheringAreasMap,
    loadData,
    getSkillById,
    getItemById,
    getGatheringAreaById,
    getGatheringAreasBySkillId,
  }
})
