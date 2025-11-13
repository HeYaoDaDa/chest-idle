<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const notificationStore = useNotificationStore()
const notifications = notificationStore.notifications

function dismiss(id: number) {
  notificationStore.remove(id)
}
</script>

<template>
  <TransitionGroup name="notification" tag="div" class="notification-center">
    <div
      v-for="entry in notifications"
      :key="entry.id"
      class="notification-card"
      :class="`notification-${entry.type}`"
    >
      <span class="notification-message">{{ t(entry.key, entry.params ?? {}) }}</span>
      <button class="notification-dismiss" type="button" @click="dismiss(entry.id)">×</button>
    </div>
  </TransitionGroup>
</template>

<style scoped lang="scss">
.notification-center {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2000;
  pointer-events: none;
}

.notification-card {
  pointer-events: auto;
  min-width: 240px;
  max-width: 360px;
  padding: 10px 12px;
  border-radius: 3px;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-left: 4px solid #3a7afe;
  color: #1f2933;
}

.notification-message {
  flex: 1;
}

.notification-dismiss {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.notification-info {
  border-color: #3a7afe;
}

.notification-warning {
  border-color: #f5a623;
}

.notification-error {
  border-color: #d64541;
}

.notification-enter-active,
.notification-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
