<script setup lang="ts">
import ChestModalBox from '@/components/modalBox/ChestModalBox.vue'
import type { Chest } from '@/models/item/Chest'
import { useGameConfigStore } from '@/stores/gameConfig'
import { usePlayerStore } from '@/stores/player'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const gameConfigStore = useGameConfigStore()
const playerStore = usePlayerStore()

const chests = computed(() => gameConfigStore.allChests)
const selectedChest = ref<Chest | null>(null)
const modalVisible = ref(false)

function getChestProgress(chestId: string): number {
  return playerStore.getChestProgress(chestId)
}

function openModal(chest: Chest) {
  selectedChest.value = chest
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  selectedChest.value = null
}
</script>

<template>
  <div id="chest-page-container">
    <div class="chest-header">
      <h2 class="chest-title">{{ t('ui.chests') }}</h2>
      <p class="chest-description">{{ t('ui.chestsDescription') }}</p>
    </div>

    <div id="chest-area-root">
      <div v-for="chest in chests" :key="chest.id" class="chest-item" @click="openModal(chest)">
        <div class="chest-name">{{ t(chest.name) }}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{
            width: (getChestProgress(chest.id) * 100) + '%',
          }"></div>
        </div>
      </div>
    </div>
  </div>

  <ChestModalBox v-model="modalVisible" :chest="selectedChest" @close="closeModal" />
</template>

<style lang="scss" scoped>
#chest-page-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.chest-header {
  background: $gradient-header;
  border: 1px solid $primary-rgba-18;
  border-radius: $spacing-xl;
  padding: $spacing-lg $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  align-items: center;
  text-align: center;

  .chest-title {
    margin: 0;
    font-size: $font-xl;
    font-weight: $font-weight-bold;
    color: $text-primary;
    letter-spacing: 0.01em;
  }

  .chest-description {
    color: $text-tertiary;
    line-height: 1.3;
    font-size: 11px;
    margin: 0;
  }
}

#chest-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: $spacing-md;

  .chest-item {
    width: $grid-item-size;
    height: $grid-item-size;
    border-radius: $radius-md;
    background: $bg-input;
    border: 1px solid $border-color;
    box-shadow: $shadow-xs;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    text-align: center;
    user-select: none;
    box-sizing: border-box;
    font-size: $font-sm;
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
      border-color: $primary-rgba-35;
    }

    .chest-name {
      font-weight: $font-weight-semibold;
      color: $text-primary;
    }
  }
}
</style>
