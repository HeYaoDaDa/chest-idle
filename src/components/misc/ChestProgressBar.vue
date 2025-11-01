<script setup lang="ts">
import type { Chest } from '@/models/item/Chest'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayerStore } from '@/stores/player'

interface Props {
  chest: Chest
}
const { chest } = defineProps<Props>()

const { t } = useI18n()
const playerStore = usePlayerStore()

const progressInnerText = computed(() => `${playerStore.getChestPoints(chest.id)}/${chest.maxPoints}`)
const progress = computed(() => playerStore.getChestProgress(chest.id) * 100)
</script>

<template>
  <div class="chest-progress-bar">
    <div>{{ t(chest.name) }}</div>
    <div class="action-bottom">
      <div class="progress-container">
        <div class="duration-show">{{ progressInnerText }}</div>
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

.chest-progress-bar {
  display: flex;
  flex-flow: column nowrap;
  padding: 6px 12px;

  .action-bottom {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 4px;

    .progress-container {
      position: relative;
      width: 256px;
      height: 16px;
      background-color: color.adjust(white, $lightness: -10%);
      border-radius: 3px;
      overflow: hidden;
      user-select: none;

      .progress-bar {
        height: 100%;
        background-color: color.adjust(white, $lightness: -30%);
        transition: width 16ms linear;
      }

      .duration-show {
        position: absolute;
        left: 50%;
        transform: translate(-50%, 0);
      }
    }
  }
}
</style>
