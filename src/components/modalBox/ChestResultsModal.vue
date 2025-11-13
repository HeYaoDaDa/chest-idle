<script setup lang="ts">
import ModalBox from '@/components/ModalBox.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface ChestResult {
  itemId: string
  amount: number
}

interface Props {
  show: boolean
  results: ChestResult[] | null
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function close() {
  emit('close')
}
</script>

<template>
  <ModalBox v-if="show && results" @close="close">
    <div class="chest-results-modal">
      <div class="chest-results-header">
        <h3 class="chest-results-title">{{ t('ui.chestOpenResults') }}</h3>
      </div>

      <div class="chest-results-content">
        <div v-if="results.length > 0" class="chest-results-list">
          <div v-for="result in results" :key="result.itemId" class="chest-result-item">
            <span class="result-item-name">{{ t(`item.${result.itemId}.name`) }}</span>
            <span class="result-item-amount">×{{ result.amount }}</span>
          </div>
        </div>
        <div v-else class="chest-results-empty">
          {{ t('ui.noItemsObtained') }}
        </div>
      </div>

      <div class="chest-results-footer">
        <div class="zone-action-buttons">
          <button type="button" class="zone-button primary" @click="close">
            {{ t('ui.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';
</style>
