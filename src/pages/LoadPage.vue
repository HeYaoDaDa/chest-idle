<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const fail = ref(false)

watchEffect(() => {
  if ('loading' === appStore.state) {
  } else if ('ready' === appStore.state) {
    router.replace('/game')
  } else if ('error' === appStore.state) {
    fail.value = true
  } else {
    appStore.loadApplication()
  }
})
</script>

<template>
  <div id="load-page-root">
    <h1 v-if="fail" id="load-data-fail-text">{{ t('loadDataFail') }}</h1>
    <h1 v-else>{{ t('loading') }}...</h1>
  </div>
</template>

<style lang="scss" scoped>
#load-page-root {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  #load-data-fail-text {
    color: $error-color;
  }
}
</style>
