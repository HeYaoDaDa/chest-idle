<script setup lang="ts">
import { useDataStore } from '@/stores/data';
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
const skillId = ref(route.params.id as string);
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string;
});

const dataStore = useDataStore();
const areas = computed(() => dataStore.getGatheringAreasBySkillId(skillId.value));
</script>

<template>
  <div id="skill-area-root">
    <div v-for="area in areas" :key="area.id">
      <div>{{ area.getName() }}</div>
      <div>{{ area.getDescription() }}</div>
    </div>
  </div>
</template>

<style lang="scss">
@use 'sass:color';

#skill-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: 10px;

  >div {
    min-width: 100px;
    min-height: 100px;
    background-color: color.adjust(white, $lightness: -10%);
  }
}
</style>
