<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import type { Chest } from '@/models/item/Chest'
import { usePlayerStore } from '@/stores/player'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const playerStore = usePlayerStore()

// Props
interface Props {
  modelValue: boolean
  chest?: Chest | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// Computed
const chestPoints = computed(() => {
  if (!props.chest) return 0
  return playerStore.getChestPoints(props.chest.id)
})

const chestProgress = computed(() => {
  if (!props.chest) return 0
  return playerStore.getChestProgress(props.chest.id)
})

const chestRemaining = computed(() => {
  if (!props.chest) return 0
  return playerStore.getChestRemaining(props.chest.id)
})

// 计算每个奖励的掉落概率（已经在 loots 中）
const lootWithProbability = computed(() => {
  if (!props.chest) return []

  return props.chest.loots.map(lootEntry => ({
    item: lootEntry.item,
    minCount: lootEntry.min,
    maxCount: lootEntry.max,
    probability: lootEntry.chance * 100 // chance 是 0-1 的值，转换为百分比
  }))
})

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString(locale.value, { minimumFractionDigits: 0, maximumFractionDigits })

function closeModal() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <ModalBox v-if="modelValue && chest" @close="closeModal">
    <div class="chest-modal">
      <header class="chest-header">
        <div class="chest-header-text">
          <span class="chest-overline">{{ t('ui.chest') }}</span>
          <h2 class="chest-title">{{ t(chest.name) }}</h2>
          <p class="chest-description">{{ t(chest.description) }}</p>
        </div>
        <button type="button" class="chest-close" @click="closeModal">×</button>
      </header>

      <div class="chest-info-list">
        <div class="info-row">
          <span class="info-label">{{ t('ui.currentProgress') }}</span>
          <span class="info-value">{{ formatNumber(chestPoints, 1) }} / {{ formatNumber(chest.maxPoints) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.progressPercentage') }}</span>
          <span class="info-value">{{ formatNumber(chestProgress * 100, 1) }}%</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.remainingPoints') }}</span>
          <span class="info-value">{{ formatNumber(chestRemaining, 1) }}</span>
        </div>

        <div class="info-divider"></div>

        <div class="info-row info-row-header">
          <span class="info-label">{{ t('ui.possibleRewards') }}</span>
        </div>

        <div class="loot-list">
          <div v-for="(loot, index) in lootWithProbability" :key="index" class="loot-item">
            <div class="loot-item-main">
              <span class="loot-item-name">{{ t(loot.item.name) }}</span>
              <span class="loot-item-amount">×{{ loot.minCount === loot.maxCount ? formatNumber(loot.minCount) : `${formatNumber(loot.minCount)}-${formatNumber(loot.maxCount)}` }}</span>
            </div>
            <div class="loot-item-probability">
              <span class="probability-label">{{ t('ui.dropChance') }}:</span>
              <span class="probability-value">{{ formatNumber(loot.probability, 2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/shared-components';

.chest-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
  min-width: min(460px, 100%);
}

.chest-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.chest-header-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.chest-overline {
  text-transform: uppercase;
  font-size: $font-sm;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.chest-title {
  margin: 0;
  font-size: $font-5xl;
  line-height: 1.2;
}

.chest-description {
  margin: 0;
  color: $text-tertiary;
  line-height: 1.5;
}

.chest-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: $text-tertiary;
  border-radius: $radius-full;
  width: $modal-close-button-size;
  height: $modal-close-button-size;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: $font-4xl;
  line-height: 1;

  &:hover {
    background: rgba(71, 85, 105, 0.22);
    color: #1f2937;
  }
}

.chest-info-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.info-divider {
  height: 1px;
  background: rgba(226, 232, 240, 0.8);
  margin: $spacing-md 0;
}

.info-row-header {
  font-weight: $font-weight-bold;
  margin-top: $spacing-sm;
}

.loot-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-sm;
}

.loot-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md $spacing-lg;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: $radius-sm;
  transition: all $transition-fast;

  &:hover {
    background: rgba(241, 245, 249, 1);
    border-color: $primary-rgba-35;
  }
}

.loot-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
}

.loot-item-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
  font-size: $font-base;
}

.loot-item-amount {
  color: $text-secondary;
  font-size: $font-sm;
  font-weight: $font-weight-medium;
}

.loot-item-probability {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-xs;
}

.probability-label {
  color: $text-tertiary;
}

.probability-value {
  color: $primary-color;
  font-weight: $font-weight-semibold;
  background: $primary-rgba-12;
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
}

@media (max-width: 540px) {
  .chest-modal {
    min-width: unset;
  }

  .info-row {
    gap: $spacing-md;
  }
}
</style>
