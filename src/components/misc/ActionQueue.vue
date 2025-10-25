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
          {{ t('ui.queue') }} ({{ actionManager.queuedActions.length }})
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
        <span class="queue-modal-count">{{ actionManager.queuedActions.length }} {{ t('ui.queuedItems') }}</span>
      </div>

      <div class="queue-modal-content">
        <ul class="queue-modal-list">
          <li v-for="(action, index) in actionManager.queuedActions" :key="index" class="queue-modal-item">
            <div class="queue-modal-item-info">
              <span class="queue-modal-item-index">{{ index + 1 }}</span>
              <div class="queue-modal-item-text">
                <span class="queue-modal-item-name">{{ t(action.target.name) }}</span>
                <span class="queue-modal-item-amount">×{{ action.amount }}</span>
              </div>
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
.action-queue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
}

.action-current {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.action-current-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.action-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.action-value {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-button {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
  white-space: nowrap;
}

.queue-button {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.queue-button:hover {
  background: rgba(37, 99, 235, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.24);
}

.stop-button {
  background: rgba(248, 113, 113, 0.16);
  color: #b91c1c;
}

.stop-button:hover {
  background: rgba(248, 113, 113, 0.24);
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(248, 113, 113, 0.24);
}

.progress-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.progress-track {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  transition: width 60ms linear;
}

.progress-duration {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #1e293b;
  pointer-events: none;
}

/* Queue Modal Styles */
.queue-modal {
  min-width: min(480px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.queue-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(37, 99, 235, 0.12);
}

.queue-modal-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.queue-modal-count {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  padding: 4px 10px;
  border-radius: 999px;
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
  gap: 8px;
}

.queue-modal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  padding: 12px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.queue-modal-item:hover {
  background: rgba(226, 232, 240, 0.5);
  border-color: rgba(37, 99, 235, 0.3);
}

.queue-modal-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.queue-modal-item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.queue-modal-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.queue-modal-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-modal-item-amount {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.queue-modal-remove {
  border: none;
  border-radius: 999px;
  background: rgba(248, 113, 113, 0.12);
  color: #b91c1c;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
  flex-shrink: 0;
}

.queue-modal-remove:hover {
  background: rgba(248, 113, 113, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(248, 113, 113, 0.2);
}

.queue-modal-footer {
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  justify-content: flex-end;
}

.queue-modal-close-button {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.queue-modal-close-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
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
