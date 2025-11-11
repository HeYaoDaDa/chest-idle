import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGameConfigStore } from './gameConfig'
import { usePlayerStore } from './player'
import { loadGameConfig } from '@/models/gameConfig'
import { useActionRunnerStore } from './actionRunner'

export const useAppStore = defineStore('app', () => {
  const status = ref(undefined as 'loading' | 'ready' | 'error' | undefined)

  async function loadApplication() {
    status.value = 'loading'
    try {
      loadGameConfig()
      // Initialize game configuration (auto-discover config via glob)
      const gameConfigStore = useGameConfigStore()
      await gameConfigStore.loadGameConfigFromGlob()

      // Initialize player data
      const playerStore = usePlayerStore()
      playerStore.initializePlayer()

      // Initialize action runner
      const actionRunnerStore = useActionRunnerStore()
      actionRunnerStore.start()

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
