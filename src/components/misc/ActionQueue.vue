<script setup lang="ts">
import { useActionStore } from '@/stores/action';
import { ref, onMounted, computed } from 'vue';

const actionStore = useActionStore();

const progress = ref(0);

const runningActionDisplay = computed(() => actionStore.runningAction?.action.toShow());
const runningActionDurationDisplay = computed(() => {
  if (actionStore.runningAction) {
    return (Math.floor(actionStore.runningAction.duration / 10) / 100) + 's';
  } else {
    return 'invalid';
  }
});

onMounted(() => {
  const animate = (timestamp: number) => {
    if (actionStore.isRunning) {
      if (actionStore.runningAction) {
        const elapsed = timestamp - actionStore.runningAction.startTime;
        progress.value = Math.min((elapsed / actionStore.runningAction.duration) * 100, 100);
      } else {
        console.error(`Action running but runningAction:(${actionStore.runningAction})`)
      }
    }
    requestAnimationFrame(animate)
  };
  requestAnimationFrame(animate);
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
      <button @click="actionStore.removeAction(0)">Stop</button>
    </div>
    <div v-if="actionStore.queuedActions.length > 0">
      <div v-for="(action, index) in actionStore.queuedActions" :key="index">
        <button @click="actionStore.removeAction(index + 1)">Remove {{ action.toShow() }}</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';

#action-div {
  display: flex;
  flex-flow: column nowrap;
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
