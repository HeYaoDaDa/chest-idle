<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { ROUTE_PATH_GAME } from '@/router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const fail = ref(false)

watchEffect(() => {
  if ('loading' === appStore.status) {
    appStore.loadApplication()
  } else if ('ready' === appStore.status) {
    router.replace(ROUTE_PATH_GAME)
  } else if ('error' === appStore.status) {
    fail.value = true
  }
})
</script>

<template>
  <div id="load-page-root">
    <h1 id="load-data-fail-text" v-if="fail">{{ t('loadDataFail') }}</h1>
    <h1 v-else>{{ t('loading') }}...</h1>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

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

