import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Definition } from '@/models/definitions'
import { useDataStore } from './data'
import { useInventoryStore } from './inventory'
import { actionManager } from '@/models/global/ActionManager'

export const useGlobalStore = defineStore('global', () => {
  const status = ref('none' as 'none' | 'loading' | 'finish' | 'fail')

  async function loadGameData() {
    status.value = 'loading'
    try {
      //definition
      const paths = [
        '/data/skills.json',
        '/data/states.json',
        '/data/slots.json',
        '/data/items/resources.json',
        '/data/items/chests.json',
        '/data/items/equipment.json',
        '/data/actionTargets/gatheringZones/mining.json',
        '/data/actionTargets/gatheringZones/woodcutting.json',
        '/data/actionTargets/gatheringZones/foraging.json',
        '/data/actionTargets/recipes.json',
      ]
      const responses = await Promise.all(paths.map((p) => axios.get(p)))
      const definitions = responses.flatMap((r) => r.data as Definition[])

      const dataStore = useDataStore()
      dataStore.load(definitions)
      const inventoryStore = useInventoryStore()
      inventoryStore.clear()
      actionManager.load()
      status.value = 'finish'
    } catch (error) {
      console.error('Failed to load data:', error)
      status.value = 'fail'
    }
  }

  return {
    status,
    loadGameData
  }
})
