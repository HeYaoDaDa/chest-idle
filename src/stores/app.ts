import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Definition } from '@/models/definitions'
import { useGameConfigStore } from './gameConfig'
import { usePlayerStore } from './player'
import { useActionQueueStore } from './actionQueue'

export const useAppStore = defineStore('app', () => {
  const status = ref('loading' as 'loading' | 'ready' | 'error')

  async function loadApplication() {
    status.value = 'loading'
    try {
      // Load game configuration data
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

      // Initialize game configuration
      const gameConfigStore = useGameConfigStore()
      gameConfigStore.loadGameConfig(definitions)

      // Initialize player data
      const playerStore = usePlayerStore()
      playerStore.initializePlayer()

      // Initialize action queue
      const actionQueueStore = useActionQueueStore()
      actionQueueStore.load()

      status.value = 'ready'
    } catch (error) {
      console.error('Failed to load application:', error)
      status.value = 'error'
    }
  }

  return {
    status,
    loadApplication
  }
})
