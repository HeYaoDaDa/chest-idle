<script setup lang="ts">
import { actionManager } from '@/models/global/ActionManager';
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const runningActionDisplay = computed(() => actionManager.currentAction.value ? t(actionManager.currentAction.value.target.name) + ' | ' + actionManager.currentAction.value.amount.value : 'Nothing...');
const runningActionDurationDisplay = computed(() => {
  if (actionManager.currentAction.value) {
    return Math.floor(actionManager.currentAction.value.duration.value / 10) / 100 + 's'
  } else {
    return ''
  }
})
const progress = computed(() => {
  if (actionManager.currentAction.value) {
    return Math.min(actionManager.currentAction.value.elapsed.value / actionManager.currentAction.value.duration.value * 100, 100);
  } else {
    return 0;
  }
});
</script>

<template>
  <div id="action-div">
    <div>{{ runningActionDisplay }}</div>
    <div class="action-bottom">
      <div class="progress-container">
        <div class="duration-show">{{ runningActionDurationDisplay }}</div>
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <button v-if="actionManager.currentAction.value" @click="actionManager.stopCurrentAction">
        {{ t('stop') }}
      </button>
    </div>
    <div v-if="actionManager.queuedActions.length > 0">
      <div v-for="(action, index) in actionManager.queuedActions" :key="index">
        <button @click="actionManager.removeQueueAction(index)">
          {{ t('remove') }} {{ t(action.target.name) + ' | ' + action.amount }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

#action-div {
  display: flex;
  flex-flow: column nowrap;
  padding: 8px 16px;
}

.action-bottom {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
}

.progress-container {
  position: relative;
  width: 256px;
  height: 16px;
  background-color: color.adjust(white, $lightness: -10%);
  border-radius: 5px;
  overflow: hidden;
  user-select: none;
}

.progress-bar {
  height: 100%;
  background-color: color.adjust(white, $lightness: -30%);
  transition: width 16ms linear;
}

.duration-show {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0);
}
</style>
