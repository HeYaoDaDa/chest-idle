<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ChestModalBox from '@/components/modalBox/ChestModalBox.vue'
import { chestConfigs } from '@/gameConfig'
import { useChestPointStore } from '@/stores/chestPoint'

const { t } = useI18n()
const chestPointStore = useChestPointStore()

// 预生成渲染所需的 chest 列表（包含进度与样式）
const chests = computed(() =>
  chestConfigs.map((config) => {
    const progress = chestPointStore.getChestProgress(config.id)
    return {
      id: config.id,
      name: config.name,
      progress,
      progressStyle: { width: progress * 100 + '%' },
    }
  }),
)
const selectedChestId = ref<string | null>(null)
const modalVisible = ref(false)

// 进度获取逻辑已上移到 chests 计算属性中

function openModal(chestId: string) {
  selectedChestId.value = chestId
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  selectedChestId.value = null
}
</script>

<template>
  <div id="chest-page-container">
    <div class="chest-header">
      <h2 class="chest-title">{{ t('ui.chests') }}</h2>
      <p class="chest-description">{{ t('ui.chestsDescription') }}</p>
    </div>

    <div id="chest-area-root">
      <div v-for="chest in chests" :key="chest.id" class="chest-item" @click="openModal(chest.id)">
        <div class="chest-name">{{ t(chest.name) }}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="chest.progressStyle"></div>
        </div>
      </div>
    </div>
  </div>

  <ChestModalBox v-model="modalVisible" :chest-id="selectedChestId" @close="closeModal" />
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
