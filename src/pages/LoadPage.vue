<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.replace('/game')
})
</script>

<template>
  <div id="load-page-root">
    <h1>Loading...</h1>
  </div>
</template>

<style lang="scss" scoped>
#load-page-root {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
