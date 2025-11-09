import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGameConfigStore } from './gameConfig'
import { usePlayerStore } from './player'
import { useActionQueueStore } from './actionQueue'

export const useAppStore = defineStore('app', () => {
  const status = ref(undefined as 'loading' | 'ready' | 'error' | undefined)

  async function loadApplication() {
    status.value = 'loading'
    try {
      // Initialize game configuration (auto-discover config via glob)
      const gameConfigStore = useGameConfigStore()
      await gameConfigStore.loadGameConfigFromGlob()

      // Initialize player data
      const playerStore = usePlayerStore()
      playerStore.initializePlayer()

      // Initialize action queue
      const actionQueueStore = useActionQueueStore()
      actionQueueStore.start()

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
