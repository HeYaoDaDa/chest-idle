<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'

const dataStore = useDataStore()
const states = computed(() => Array.from(dataStore.stateIdMap.entries()))
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
