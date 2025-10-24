<script setup lang="ts">
import { dataManager } from '@/models/global/DataManager'
</script>

<template>
  <div>
    <ul>
      <li v-for="state in dataManager.allStateMap.entries()" :key="state[0]">
        {{ state[0] }} : {{ state[1].base }} - {{ state[1].value }}
      </li>
    </ul>
  </div>
</template>
