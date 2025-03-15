import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCharacterStore = defineStore('character', () => {
  const miningXp = ref(0)
  function addMiningXp(xp: number) {
    miningXp.value += xp
  }
  const woodcuttingXp = ref(0)
  function addWoodcuttingXp(xp: number) {
    woodcuttingXp.value += xp
  }
  return {
    miningXp,
    addMiningXp,
    woodcuttingXp,
    addWoodcuttingXp,
  }
})
