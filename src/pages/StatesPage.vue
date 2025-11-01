<script setup lang="ts">
import { computed } from 'vue'
import { useGameConfigStore } from '@/stores/gameConfig'

const gameConfigStore = useGameConfigStore()
const states = computed(() => Array.from(gameConfigStore.stateMap.entries()))
</script>

<template>
  <div>
    <ul>
      <li v-for="state in states" :key="state[0]">
        {{ state[0] }} : {{ state[1].base }} - {{ state[1].value }}
      </li>
    </ul>
  </div>
</template>
