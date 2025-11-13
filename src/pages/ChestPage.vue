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
    <div class="page-header">
      <h2 class="page-title">{{ t('ui.chests') }}</h2>
      <p class="page-description">{{ t('ui.chestsDescription') }}</p>
    </div>

    <div class="grid-container">
      <div v-for="chest in chests" :key="chest.id" class="grid-item" @click="openModal(chest.id)">
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

.chest-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}
</style>
