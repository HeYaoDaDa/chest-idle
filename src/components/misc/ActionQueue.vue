<script setup lang="ts">
import ActionQueueModal from './ActionQueueModal.vue'
import { useActionQueueStore } from '@/stores/actionQueue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showQueueModal = ref(false)
const actionQueueStore = useActionQueueStore()

const runningActionDisplay = computed(() =>
  actionQueueStore.currentAction
    ? `${t(actionQueueStore.currentAction.target.name)} · ${actionQueueStore.currentAction.amount === Infinity ? '∞' : actionQueueStore.currentAction.amount}`
    : `${t('nothing')}...`,
)

const runningActionDurationDisplay = computed(() => {
  if (actionQueueStore.currentAction) {
    return `${(Math.floor(actionQueueStore.currentAction.target.getDuration() / 10) / 100).toFixed(2)}s`
  }
  return ''
})

const hasQueuedActions = computed(() => actionQueueStore.queueingActions.length > 0)

const unifiedLength = computed(() => actionQueueStore.queueLength)

function openQueueModal() {
  showQueueModal.value = true
}

function closeQueueModal() {
  showQueueModal.value = false
}

function stopCurrentAction() {
  if (actionQueueStore.currentAction) {
    actionQueueStore.removeAction(0)
  }
}
</script>

<template>
  <div class="action-queue">
    <div class="action-current">
      <div class="action-current-text">
        <span class="action-label">{{ t('ui.currentAction') }}</span>
        <span class="action-value">{{ runningActionDisplay }}</span>
      </div>
      <div class="action-buttons">
        <button v-if="actionQueueStore.currentAction" class="action-button stop-button" type="button"
          @click="stopCurrentAction">
          {{ t('stop') }}
        </button>
        <button v-if="hasQueuedActions" class="action-button queue-button" type="button" @click="openQueueModal">
          {{ t('ui.queue') }} ({{ unifiedLength }})
        </button>
      </div>
    </div>

    <div class="progress-wrapper">
      <div class="progress-bar-container progress-track">
        <div class="progress-bar" :style="{ width: actionQueueStore.progress + '%' }"></div>
      </div>
      <span class="progress-duration" v-if="runningActionDurationDisplay">{{
        runningActionDurationDisplay
      }}</span>
    </div>
  </div>

  <!-- Queue Modal -->
  <ActionQueueModal :show="showQueueModal" @close="closeQueueModal" />
</template>

<style lang="scss" scoped>
.action-queue {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  color: $text-primary;
}

.action-current {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-xl;
}

.action-current-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
  min-width: 0;
}

.action-label {
  font-size: $font-sm;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $text-quaternary;
}

.action-value {
  font-size: $font-lg;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  flex-shrink: 0;
}

.action-button {
  border: none;
  border-radius: $radius-full;
  padding: $spacing-lg $spacing-xl;
  font-weight: $font-weight-semibold;
  font-size: $font-base;
  cursor: pointer;
  transition:
    background $transition-fast,
    transform $transition-fast,
    box-shadow $transition-fast;
  white-space: nowrap;
}

.queue-button {
  background: $primary-rgba-12;
  color: $primary-color;
}

.queue-button:hover {
  background: $primary-rgba-20;
  transform: translateY(-2px);
  box-shadow: 0 10px 18px $primary-rgba-24;
}

.stop-button {
  background: $error-rgba-16;
  color: $error-color;
}

.stop-button:hover {
  background: $error-rgba-24;
  transform: translateY(-2px);
  box-shadow: 0 10px 18px $error-rgba-24;
}

.progress-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.progress-duration {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-sm;
  color: $text-secondary;
  pointer-events: none;
}

.progress-track {
  height: $progress-bar-large;
}

@media (max-width: 540px) {
  .action-buttons {
    flex-direction: column;
  }
}
</style>
