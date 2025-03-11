<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <teleport to="body">
    <div id="modal-box">
      <div id="modal-background" @click.stop.prevent="emit('close')"></div>
      <div id="modal-content">
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss">
#modal-box {
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  #modal-background {
    height: 100%;
    width: 100%;
    background-color: black;
    opacity: 0.8;
  }

  #modal-content {
    position: absolute;
    border-radius: 4px;
    overflow: auto;

    min-width: 300px;
    max-width: 98%;
    min-height: 100px;
    max-height: 98%;

    background-color: white;
    box-shadow: 0 0 4px 4px hsla(0, 0%, 81.6%, 0.2823529412);
  }
}
</style>
