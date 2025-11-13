<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ModalBox from '@/components/ModalBox.vue'
import { useActionQueueStore } from '@/stores/actionQueue'

const { t } = useI18n()
const actionQueueStore = useActionQueueStore()

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const unifiedLength = computed(() => actionQueueStore.queueLength)

// ActionQueue 页面使用完整显示，这里不需要该组合文案
const progress = computed(() => actionQueueStore.progress + '%')

// 在 Modal 中，名称已单独展示，这里只需显示数量（或 ∞）
const runningActionAmountDisplay = computed(() =>
  actionQueueStore.currentAction
    ? actionQueueStore.currentAction.amount === Infinity
      ? '∞'
      : String(actionQueueStore.currentAction.amount)
    : '',
)

function closeModal() {
  emit('close')
}

function stopCurrentAction() {
  if (actionQueueStore.currentAction) {
    actionQueueStore.removeAction(0)
  }
}

function moveActionUp(index: number) {
  actionQueueStore.moveUp(index)
}

function moveActionDown(index: number) {
  actionQueueStore.moveDown(index)
}

function moveActionToTop(index: number) {
  actionQueueStore.moveTop(index)
}

function moveActionToBottom(index: number) {
  actionQueueStore.moveBottom(index)
}

function removeQueuedAction(index: number) {
  actionQueueStore.removeAction(index + 1) // +1 因为 currentAction 在 index 0
}
</script>

<template>
  <ModalBox v-if="show" @close="closeModal">
    <div class="queue-modal">
      <div class="queue-modal-header">
        <h3 class="queue-modal-title">{{ t('ui.queue') }}</h3>
        <span class="queue-modal-count">{{ unifiedLength }} {{ t('ui.queuedItems') }}</span>
      </div>

      <div class="queue-modal-content">
        <ul class="queue-modal-list">
          <!-- Running as first item (index 0 in unified list) -->
          <li v-if="actionQueueStore.currentActionDetail" class="queue-modal-item running-item">
            <div class="queue-modal-item-info">
              <span class="queue-modal-item-index">0</span>
              <div class="queue-modal-item-text">
                <span class="queue-modal-item-name">{{
                  t(actionQueueStore.currentActionDetail.name)
                }}</span>
                <span class="queue-modal-item-amount">×{{ runningActionAmountDisplay }}</span>
              </div>
            </div>
            <div class="running-progress-wrapper">
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: progress }"></div>
              </div>
            </div>
            <div class="queue-modal-controls">
              <button type="button" class="control-btn" title="Top" disabled>⏫</button>
              <button type="button" class="control-btn" title="Up" disabled>▲</button>
              <button
                type="button"
                class="control-btn"
                title="Down"
                :disabled="unifiedLength <= 1"
                @click="moveActionDown(0)"
              >
                ▼
              </button>
              <button
                type="button"
                class="control-btn"
                title="Bottom"
                :disabled="unifiedLength <= 1"
                @click="moveActionToBottom(0)"
              >
                ⏬
              </button>
            </div>
            <button type="button" class="queue-modal-stop" @click="stopCurrentAction">
              {{ t('stop') }}
            </button>
          </li>

          <li
            v-for="(action, index) in actionQueueStore.pendingActions"
            :key="index"
            class="queue-modal-item"
          >
            <div class="queue-modal-item-info">
              <!-- unified index: current ? index+1 : index -->
              <span class="queue-modal-item-index">{{
                actionQueueStore.currentAction ? index + 1 : index
              }}</span>
              <div class="queue-modal-item-text">
                <span class="queue-modal-item-name">{{ t(`action.${action.actionId}.name`) }}</span>
                <span class="queue-modal-item-amount"
                  >×{{ action.amount === Infinity ? '∞' : action.amount }}</span
                >
              </div>
            </div>
            <div class="queue-modal-controls">
              <button
                type="button"
                class="control-btn"
                title="Top"
                :disabled="(actionQueueStore.currentAction ? index + 1 : index) === 0"
                @click="moveActionToTop(actionQueueStore.currentAction ? index + 1 : index)"
              >
                ⏫
              </button>
              <button
                type="button"
                class="control-btn"
                title="Up"
                :disabled="(actionQueueStore.currentAction ? index + 1 : index) === 0"
                @click="moveActionUp(actionQueueStore.currentAction ? index + 1 : index)"
              >
                ▲
              </button>
              <button
                type="button"
                class="control-btn"
                title="Down"
                :disabled="
                  (actionQueueStore.currentAction ? index + 1 : index) >= unifiedLength - 1
                "
                @click="moveActionDown(actionQueueStore.currentAction ? index + 1 : index)"
              >
                ▼
              </button>
              <button
                type="button"
                class="control-btn"
                title="Bottom"
                :disabled="
                  (actionQueueStore.currentAction ? index + 1 : index) >= unifiedLength - 1
                "
                @click="moveActionToBottom(actionQueueStore.currentAction ? index + 1 : index)"
              >
                ⏬
              </button>
            </div>
            <button type="button" class="queue-modal-remove" @click="removeQueuedAction(index)">
              {{ t('remove') }}
            </button>
          </li>
        </ul>
      </div>

      <div class="queue-modal-footer">
        <button type="button" class="queue-modal-close-button" @click="closeModal">
          {{ t('ui.close') }}
        </button>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
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
  color: $color-error-dark;
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
  color: $color-error-dark;
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
}
</style>
