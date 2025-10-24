<script setup lang="ts">
import { actionManager } from '@/models/global/ActionManager';
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const runningActionDisplay = computed(() =>
  actionManager.currentAction.value
    ? `${t(actionManager.currentAction.value.target.name)} · ${actionManager.currentAction.value.amountDisplay.value}`
    : `${t('nothing')}...`
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
      (actionManager.currentAction.value.elapsed.value / actionManager.currentAction.value.duration.value) * 100,
      100,
    )
  }
  return 0
});
</script>

<template>
  <div class="action-queue">
    <div class="action-current">
      <div class="action-current-text">
        <span class="action-label">{{ t('ui.currentAction') }}</span>
        <span class="action-value">{{ runningActionDisplay }}</span>
      </div>
      <button
        v-if="actionManager.currentAction.value"
        class="action-button"
        type="button"
        @click="actionManager.stopCurrentAction"
      >
        {{ t('stop') }}
      </button>
    </div>

    <div class="progress-wrapper">
      <div class="progress-track">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-duration" v-if="runningActionDurationDisplay">{{ runningActionDurationDisplay }}</span>
    </div>

    <div v-if="actionManager.queuedActions.length > 0" class="queue-list">
      <span class="queue-title">{{ t('ui.queue') }}</span>
      <ul>
        <li v-for="(action, index) in actionManager.queuedActions" :key="index" class="queue-item">
          <div class="queue-item-text">
            <span class="queue-item-name">{{ t(action.target.name) }}</span>
            <span class="queue-item-amount">×{{ action.amount }}</span>
          </div>
          <button type="button" class="queue-remove" @click="actionManager.removeQueueAction(index)">
            {{ t('remove') }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.action-queue {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #0f172a;
}

.action-current {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.action-current-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
}

.action-button {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  background: rgba(248, 113, 113, 0.16);
  color: #b91c1c;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.action-button:hover {
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

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.queue-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 10px 14px;
}

.queue-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.queue-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.queue-item-amount {
  font-size: 12px;
  color: #64748b;
}

.queue-remove {
  border: none;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.queue-remove:hover {
  background: rgba(37, 99, 235, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 10px 16px rgba(37, 99, 235, 0.2);
}
</style>
