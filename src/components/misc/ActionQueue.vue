<script setup lang="ts">
import ModalBox from './ModalBox.vue'
import { actionManager } from '@/models/global/ActionManager'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const showQueueModal = ref(false)

const runningActionDisplay = computed(() =>
  actionManager.currentAction.value
    ? `${t(actionManager.currentAction.value.target.name)} · ${actionManager.currentAction.value.amountDisplay.value}`
    : `${t('nothing')}...`,
)

const runningActionDurationDisplay = computed(() => {
  if (actionManager.currentAction.value) {
    return `${(Math.floor(actionManager.currentAction.value.duration.value / 10) / 100).toFixed(2)}s`
  }
  return ''
})

const progress = computed(() => {
  if (actionManager.currentAction.value) {
    return Math.min(
      (actionManager.currentAction.value.elapsed.value /
        actionManager.currentAction.value.duration.value) *
        100,
      100,
    )
  }
  return 0
})

const hasQueuedActions = computed(() => actionManager.queuedActions.length > 0)

const unifiedLength = computed(() => (actionManager.currentAction.value ? 1 : 0) + actionManager.queuedActions.length)

function openQueueModal() {
  showQueueModal.value = true
}

function closeQueueModal() {
  showQueueModal.value = false
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
        <button
          v-if="actionManager.currentAction.value"
          class="action-button stop-button"
          type="button"
          @click="actionManager.stopCurrentAction"
        >
          {{ t('stop') }}
        </button>
        <button
          v-if="hasQueuedActions"
          class="action-button queue-button"
          type="button"
          @click="openQueueModal"
        >
          {{ t('ui.queue') }} ({{ unifiedLength }})
        </button>
      </div>
    </div>

    <div class="progress-wrapper">
      <div class="progress-track">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-duration" v-if="runningActionDurationDisplay">{{
        runningActionDurationDisplay
      }}</span>
    </div>
  </div>

  <!-- Queue Modal -->
  <ModalBox v-if="showQueueModal" @close="closeQueueModal">
    <div class="queue-modal">
      <div class="queue-modal-header">
        <h3 class="queue-modal-title">{{ t('ui.queue') }}</h3>
  <span class="queue-modal-count">{{ unifiedLength }} {{ t('ui.queuedItems') }}</span>
      </div>

      <div class="queue-modal-content">
        <ul class="queue-modal-list">
          <!-- Running as first item (index 0 in unified list) -->
          <li v-if="actionManager.currentAction.value" class="queue-modal-item running-item">
            <div class="queue-modal-item-info">
              <span class="queue-modal-item-index">0</span>
              <div class="queue-modal-item-text">
                <span class="queue-modal-item-name">{{ t(actionManager.currentAction.value.target.name) }}</span>
                <span class="queue-modal-item-amount">×{{ actionManager.currentAction.value.amountDisplay.value }}</span>
              </div>
            </div>
            <div class="running-progress-wrapper">
              <div class="running-progress-track">
                <div class="running-progress-bar" :style="{ width: progress + '%' }"></div>
              </div>
            </div>
            <div class="queue-modal-controls">
              <button type="button" class="control-btn" title="Top" disabled>
                ⏫
              </button>
              <button type="button" class="control-btn" title="Up" disabled>
                ▲
              </button>
              <button
                type="button"
                class="control-btn"
                title="Down"
                :disabled="unifiedLength <= 1"
                @click="actionManager.moveDown(0)"
              >
                ▼
              </button>
              <button
                type="button"
                class="control-btn"
                title="Bottom"
                :disabled="unifiedLength <= 1"
                @click="actionManager.moveBottom(0)"
              >
                ⏬
              </button>
            </div>
            <button
              type="button"
              class="queue-modal-stop"
              @click="actionManager.stopCurrentAction"
            >
              {{ t('stop') }}
            </button>
          </li>

          <li v-for="(action, index) in actionManager.queuedActions" :key="index" class="queue-modal-item">
            <div class="queue-modal-item-info">
              <!-- unified index: current ? index+1 : index -->
              <span class="queue-modal-item-index">{{ (actionManager.currentAction.value ? index + 1 : index) }}</span>
              <div class="queue-modal-item-text">
                <span class="queue-modal-item-name">{{ t(action.target.name) }}</span>
                <span class="queue-modal-item-amount">×{{ action.amountDisplay }}</span>
              </div>
            </div>
            <div class="queue-modal-controls">
              <button
                type="button"
                class="control-btn"
                title="Top"
                :disabled="(actionManager.currentAction.value ? index + 1 : index) === 0"
                @click="actionManager.moveTop(actionManager.currentAction.value ? index + 1 : index)"
              >
                ⏫
              </button>
              <button
                type="button"
                class="control-btn"
                title="Up"
                :disabled="(actionManager.currentAction.value ? index + 1 : index) === 0"
                @click="actionManager.moveUp(actionManager.currentAction.value ? index + 1 : index)"
              >
                ▲
              </button>
              <button
                type="button"
                class="control-btn"
                title="Down"
                :disabled="(actionManager.currentAction.value ? index + 1 : index) >= unifiedLength - 1"
                @click="actionManager.moveDown(actionManager.currentAction.value ? index + 1 : index)"
              >
                ▼
              </button>
              <button
                type="button"
                class="control-btn"
                title="Bottom"
                :disabled="(actionManager.currentAction.value ? index + 1 : index) >= unifiedLength - 1"
                @click="actionManager.moveBottom(actionManager.currentAction.value ? index + 1 : index)"
              >
                ⏬
              </button>
            </div>
            <button
              type="button"
              class="queue-modal-remove"
              @click="actionManager.removeQueueAction(index)"
            >
              {{ t('remove') }}
            </button>
          </li>
        </ul>
      </div>

      <div class="queue-modal-footer">
        <button type="button" class="queue-modal-close-button" @click="closeQueueModal">
          {{ t('ui.close') }}
        </button>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

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

.progress-track {
  width: 100%;
  height: $progress-bar-large;
  border-radius: $radius-full;
  background: rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: $gradient-primary;
  transition: width 60ms linear;
}

.progress-duration {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-sm;
  color: $text-secondary;
  pointer-events: none;
}

/* Queue Modal Styles */
.queue-modal {
  min-width: min(480px, 90vw);
  display: flex;
  flex-direction: column;
  gap: $spacing-3xl;
}

.queue-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $spacing-2xl;
  border-bottom: 2px solid $primary-rgba-12;
}

.queue-modal-title {
  margin: 0;
  font-size: $font-3xl;
  font-weight: $font-weight-bold;
  color: $text-primary;
}

.queue-modal-count {
  font-size: $font-base;
  font-weight: $font-weight-semibold;
  color: $primary-color;
  background: $primary-rgba-08;
  padding: $spacing-sm $spacing-xl;
  border-radius: $radius-full;
}

.queue-modal-content {
  max-height: 400px;
  overflow-y: auto;
}

.queue-modal-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.queue-modal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-2xl;
  background: $bg-input;
  border: 1px solid $border-color-light;
  border-radius: $radius-md;
  padding: $spacing-2xl;
  transition:
    background $transition-fast,
    border-color $transition-fast;
}

.queue-modal-item.running-item {
  flex-wrap: wrap;
  background: $primary-rgba-05;
  border-color: $primary-rgba-30;
}

.queue-modal-item:hover {
  background: rgba(226, 232, 240, 0.5);
  border-color: $primary-rgba-30;
}

.queue-modal-item.running-item:hover {
  background: $primary-rgba-08;
}

.queue-modal-item-info {
  display: flex;
  align-items: center;
  gap: $spacing-2xl;
  flex: 1;
  min-width: 0;
}

.queue-modal-item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: $primary-rgba-12;
  color: $primary-color;
  border-radius: 50%;
  font-size: $font-base;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
}

.queue-modal-item-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
  min-width: 0;
}

.queue-modal-item-name {
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-modal-item-amount {
  font-size: $font-base;
  color: $text-quaternary;
  font-weight: $font-weight-normal;
}

.queue-modal-remove {
  border: none;
  border-radius: $radius-full;
  background: $error-rgba-12;
  color: $error-color;
  padding: $spacing-md $spacing-2xl;
  font-size: $font-base;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition:
    background $transition-fast,
    transform $transition-fast,
    box-shadow $transition-fast;
  flex-shrink: 0;
}

.queue-modal-remove:hover {
  background: $error-rgba-20;
  transform: translateY(-1px);
  box-shadow: 0 8px 14px $error-rgba-20;
}

.queue-modal-stop {
  border: none;
  border-radius: $radius-full;
  background: $error-rgba-12;
  color: $error-color;
  padding: $spacing-md $spacing-2xl;
  font-size: $font-base;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition:
    background $transition-fast,
    transform $transition-fast,
    box-shadow $transition-fast;
  flex-shrink: 0;
}

.queue-modal-stop:hover {
  background: $error-rgba-20;
  transform: translateY(-1px);
  box-shadow: 0 8px 14px $error-rgba-20;
}

.running-progress-wrapper {
  width: 100%;
  order: 10;
}

.running-progress-track {
  width: 100%;
  height: $progress-bar-thick;
  border-radius: $radius-full;
  background: rgba(226, 232, 240, 0.6);
  overflow: hidden;
}

.running-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: $gradient-primary;
  transition: width 60ms linear;
}

.queue-modal-footer {
  padding-top: $spacing-2xl;
  border-top: 1px solid $border-color-lighter;
  display: flex;
  justify-content: flex-end;
}

.queue-modal-controls {
  display: flex;
  gap: $spacing-md;
}

.control-btn {
  border: 1px solid $border-color;
  background: $bg-input;
  color: #1f2937;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-sm;
  font-size: $font-sm;
  cursor: pointer;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.queue-modal-close-button {
  border: none;
  border-radius: $radius-full;
  padding: $spacing-xl $spacing-4xl;
  font-size: $font-md;
  font-weight: $font-weight-semibold;
  background: $gradient-primary-dark;
  color: #ffffff;
  cursor: pointer;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;
}

.queue-modal-close-button:hover {
  transform: translateY(-1px);
  box-shadow: $shadow-focus;
}

@media (max-width: 540px) {
  .queue-modal {
    min-width: unset;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>

