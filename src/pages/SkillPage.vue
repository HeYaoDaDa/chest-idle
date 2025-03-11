<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue';
import { Amount } from '@/model/common/Amount';
import type { GatheringArea } from '@/model/data/GatheringArea';
import { useActionStore } from '@/stores/action';
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

const actionStore = useActionStore();
const openArea = ref(undefined as GatheringArea | undefined);
const amount = ref('∞')
const allowStart = computed(() => Amount.verify(amount.value));
function openModal(area: GatheringArea) {
  openArea.value = area;
}
function closeModal() {
  openArea.value = undefined;
  amount.value = '∞';
}
function addAction(area: GatheringArea) {
  actionStore.addAction(area, Amount.from(amount.value));
  openArea.value = undefined;
}
</script>

<template>
  <div id="skill-area-root">
    <div v-for="area in areas" :key="area.id" @click="openModal(area)">
      <div>{{ area.getName() }}</div>
    </div>
  </div>
  <ModalBox v-if="openArea" @close="closeModal">
    <div id="area-modal-box">
      <div>{{ openArea.getName() }}</div>
      <div>{{ openArea.skill.getName() }}</div>
      <div>{{ openArea.getDescription() }}</div>
      <div>{{ openArea.baseTime / 1000 }}s</div>
      <div v-for="loot, index in openArea.products" :key="index">
        {{ loot.percentage }}% {{ loot.item.getName() }}: {{ loot.min }}-{{ loot.max }}
      </div>
      <div>
        <input type="text" v-model="amount" />
        <button @click="amount = '∞'">∞</button>
      </div>
      <button @click="addAction(openArea)" :disabled="!allowStart">Start</button>
    </div>
  </ModalBox>
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

    display: flex;
    justify-content: center;
    align-items: center;
  }
}

#area-modal-box {
  display: flex;
  flex-flow: column nowrap;
  padding: 8px;
  gap: 4px;
}
</style>
