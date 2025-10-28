<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  close: []
}>()

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <teleport to="body">
    <div class="modal-wrapper">
      <div class="modal-backdrop" @click.stop.prevent="emit('close')"></div>
      <Transition name="modal-fade" appear>
        <div class="modal-panel">
          <slot></slot>
        </div>
      </Transition>
    </div>
  </teleport>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: $spacing-3xl;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  backdrop-filter: blur(2px) saturate(140%);
}

.modal-panel {
  position: relative;
  max-height: min(720px, 90vh);
  width: min(520px, 100%);
  background-color: #ffffff;
  border-radius: $radius-md;
  box-shadow: 0 18px 48px $shadow-color;
  overflow: hidden auto;
  padding: $spacing-3xl;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 480px) {
  .modal-wrapper {
    padding: $spacing-lg;
  }

  .modal-panel {
    padding: $spacing-2xl;
    border-radius: $radius-sm;
  }
}
</style>

